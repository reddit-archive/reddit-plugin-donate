from pylons import tmpl_context as c
from pylons import app_globals as g

from r2.lib.db import tdb_cassandra
from r2.lib.errors import errors
from r2.lib.validator import Validator, VInt

from reddit_donate.models import DonationOrganization


class VOrganization(VInt):
    def run(self, ein_text):
        try:
            ein = int(ein_text)
            return DonationOrganization.byEIN(ein)
        except (TypeError, ValueError, tdb_cassandra.NotFound):
            self.set_error(errors.DONATE_UNKNOWN_ORGANIZATION)
            return None


class VAccountEligible(Validator):
    def run(self):
        eligible_date = g.plugins['donate'].eligible_date
        if not eligible_date:
            return True
        if not c.user_is_loggedin or c.user._date >= eligible_date:
            self.set_error(errors.DONATE_ACCOUNT_NOT_ELIGIBLE, field='eligible')
            return False
        return True
