from pylons import c, g
from pylons.i18n import _

from r2.config import feature
from r2.controllers import add_controller
from r2.controllers.reddit_base import RedditController
from r2.lib.errors import errors
from r2.lib.template_helpers import join_urls
from r2.lib.validator import (
    json_validate,
    validate,
    validatedForm,
    VLength,
    VModhash,
    VRatelimit,
    VUser,
)

from reddit_donate import pages
from reddit_donate.validators import VAccountEligible, VOrganization
from reddit_donate.models import (
    DonationNominationsByAccount,
    DonationOrganization,
    DonationOrganizationsByPrefix,
)


NOMINATION_COOLDOWN = 1  # seconds


def inject_nomination_status(organizations, assume_nominated=False):
    nominations = {}
    if c.user_is_loggedin:
        if not assume_nominated:
            nominations = DonationNominationsByAccount.fast_query(
                c.user, organizations)
        else:
            nominations = {(c.user, org): True for org in organizations}

    wrapped = []
    for org in organizations:
        data = org.data.copy()
        data["Nominated"] = (c.user, org) in nominations
        wrapped.append(data)
    return wrapped


@add_controller
class DonateController(RedditController):
    def GET_closed(self):
        return pages.DonatePage(
            title=_("reddit donate"),
            content=pages.DonateClosed(),
        ).render()

    @validate(
        eligible=VAccountEligible(),
        organization=VOrganization("organization"),
    )
    def GET_landing(self, eligible, organization):
        if not feature.is_enabled('reddit_donate'):
            return self.abort404()

        if c.user_is_loggedin:
            nomination_count = DonationNominationsByAccount.count(c.user)
        else:
            nomination_count = None

        if organization:
            wrapped_organization = inject_nomination_status([organization])
        else:
            wrapped_organization = None

        content = pages.DonateLanding(
            eligible=eligible,
        )

        og_data = {
            "site_name": "reddit.com",
        }

        if organization:
            og_data["title"] = "reddit donate: vote for %s" % organization.data["DisplayName"]
            og_data["url"] = join_urls(g.origin, "donate?organization=%s" % organization.data["EIN"])
        else:
            og_data["title"] = "reddit donate: giving 10% back"
            og_data["url"] = join_urls(g.origin, "donate")


        return pages.DonatePage(
            title=_("reddit donate"),
            content=content,
            og_data=og_data,
            extra_js_config={
                "unloadedNominations": nomination_count,
                "accountIsEligible": eligible,
                "organization": wrapped_organization,
            },
        ).render()

    @validatedForm(
        VUser(),
        VModhash(),
        VRatelimit(rate_user=True, prefix="donate_nominate_"),
        VAccountEligible(),
        organization=VOrganization("organization"),
    )
    def POST_nominate(self, form, jquery, organization):
        if not feature.is_enabled('reddit_donate'):
            return self.abort404()

        if form.has_errors("organization", errors.DONATE_UNKNOWN_ORGANIZATION):
            return

        if form.has_errors("eligible", errors.DONATE_ACCOUNT_NOT_ELIGIBLE):
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
        if not feature.is_enabled('reddit_donate'):
            return self.abort404()

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

        if not feature.is_enabled('reddit_donate'):
            return self.abort404()

        if responder.has_errors("organization",
                                errors.DONATE_UNKNOWN_ORGANIZATION):
            return

        wrapped = inject_nomination_status([organization])
        return wrapped[0]

    @json_validate(
        prefix=VLength("prefix", min_length=3, max_length=100),
    )
    def GET_search(self, responder, prefix):
        """Get organizations by display-name prefix."""

        if not feature.is_enabled('reddit_donate'):
            return self.abort404()

        if responder.has_errors("prefix", errors.TOO_LONG, errors.TOO_SHORT):
            return

        organizations = DonationOrganizationsByPrefix.byPrefix(prefix)
        return inject_nomination_status(organizations)

    @json_validate(
        VUser(),
    )
    def GET_nominations(self, responder):
        if not feature.is_enabled('reddit_donate'):
            return self.abort404()
        nominated_org_ids = DonationNominationsByAccount.get_for(c.user)
        orgs = DonationOrganization.byEIN(nominated_org_ids)
        wrapped = inject_nomination_status(orgs, assume_nominated=True)
        return wrapped
