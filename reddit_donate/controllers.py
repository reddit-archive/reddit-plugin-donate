from pylons import c
from pylons.i18n import _

from r2.controllers import add_controller
from r2.controllers.reddit_base import (
    pagecache_policy,
    PAGECACHE_POLICY,
    RedditController,
)
from r2.lib.errors import errors
from r2.lib.validator import (
    json_validate,
    validatedForm,
    VLength,
    VModhash,
    VRatelimit,
    VUser,
)

from reddit_donate import pages
from reddit_donate.validators import VOrganization
from reddit_donate.models import (
    DonationNominationsByAccount,
    DonationOrganizationsByPrefix,
)


NOMINATION_COOLDOWN = 15  # seconds


@add_controller
class DonateController(RedditController):
    def GET_landing(self):
        content = pages.DonateLanding()
        return pages.DonatePage(
            title=_("reddit donate"),
            content=content,
        ).render()

    @validatedForm(
        VUser(),
        VModhash(),
        VRatelimit(rate_user=True, prefix="donate_nominate_"),
        organization=VOrganization("organization"),
    )
    def POST_nominate(self, form, jquery, organization):
        if form.has_errors("organization", errors.DONATE_UNKNOWN_ORGANIZATION):
            return

        if form.has_errors("ratelimit", errors.RATELIMIT):
            return
        else:
            VRatelimit.ratelimit(
                rate_user=True,
                prefix="donate_nominate_",
                seconds=NOMINATION_COOLDOWN,
            )

        DonationNominationsByAccount.nominate(
            c.user,
            organization,
        )

    @validatedForm(
        VUser(),
        VModhash(),
        organization=VOrganization("organization"),
    )
    def POST_unnominate(self, form, jquery, organization):
        if form.has_errors("organization", errors.DONATE_UNKNOWN_ORGANIZATION):
            return

        DonationNominationsByAccount.unnominate(
            c.user,
            organization,
        )

    @json_validate(
        organization=VOrganization("organization"),
    )
    def GET_organization(self, responder, organization):
        """Look up a single org by EIN."""

        if responder.has_errors("organization",
                                errors.DONATE_UNKNOWN_ORGANIZATION):
            return

        has_nominated = False
        if c.user_is_loggedin:
            has_nominated = DonationNominationsByAccount.has_nominated(
                c.user, organization)
        organization.data["Nominated"] = has_nominated

        return organization.data

    @pagecache_policy(PAGECACHE_POLICY.LOGGEDIN_AND_LOGGEDOUT)
    @json_validate(
        prefix=VLength("prefix", min_length=3, max_length=100),
    )
    def GET_search(self, responder, prefix):
        """Get organizations by display-name prefix."""

        if responder.has_errors("prefix", errors.TOO_LONG, errors.TOO_SHORT):
            return

        return DonationOrganizationsByPrefix.byPrefix(prefix)
