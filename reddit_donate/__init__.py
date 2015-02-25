"""reddit's end-of-year charity donation process.


"""

import datetime
import pytz

from pylons.i18n import N_

from r2.config.routing import not_in_sr
from r2.lib.js import LocalizedModule
from r2.lib.plugin import Plugin

ELIGIBLE_DATE_STR = "2015-02-18"

class Donate(Plugin):
    needs_static_build = True

    errors = {
        "DONATE_UNKNOWN_ORGANIZATION":
            N_("unknown organization"),
        "DONATE_ACCOUNT_NOT_ELIGIBLE":
            N_("account must be created before %s" % ELIGIBLE_DATE_STR),
    }

    js = {
        "donate": LocalizedModule("donate.js",
            "lib/react-with-addons-0.11.2.js",
            "lib/flux.js",
            "flux.store.js",
            "donate-base.js",
            "donate-stores.js",
            "donate-views.js",
            "donate.js",
        ),
    }

    def add_routes(self, mc):
        mc(
            "/donate/organizations/:organization",
            controller="donate",
            action="organization",
            conditions={"function": not_in_sr},
        )

        mc(
            "/donate/organizations",
            controller="donate",
            action="search",
            conditions={"function": not_in_sr},
        )

        mc(
            "/donate/nominations",
            controller="donate",
            action="nominations",
            conditions={"function": not_in_sr},
        )

        mc(
            "/donate",
            controller="donate",
            action="closed",
            conditions={"function": not_in_sr},
        )

        mc(
            "/api/donate/:action",
            controller="donate",
            conditions={"function": not_in_sr},
        )


    def load_controllers(self):
        from reddit_donate.controllers import (
            DonateController,
        )

        eligible_date = None

        if ELIGIBLE_DATE_STR:
            try:
                eligible_date = (
                    datetime.datetime.strptime(ELIGIBLE_DATE_STR, '%Y-%m-%d')
                   .replace(tzinfo=pytz.utc)
                )
            except ValueError:
                pass

        self.eligible_date_str = ELIGIBLE_DATE_STR
        self.eligible_date = eligible_date
