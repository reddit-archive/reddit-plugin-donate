from pylons import c
from pylons.i18n import _

from r2.controllers import add_controller
from r2.controllers.reddit_base import RedditController
from r2.lib.errors import errors
from r2.lib.validator import (
    validatedForm,
    VModhash,
    VRatelimit,
    VUser,
)

from reddit_donate import pages
from reddit_donate.validators import VOrganization
from reddit_donate.models import DonationNominationsByAccount


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
