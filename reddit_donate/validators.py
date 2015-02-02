import datetime

import pytz
from pylons import c

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
        blog_post_date = datetime.datetime(2014, 2, 28, tzinfo=pytz.utc)
        if not c.user_is_loggedin or c.user._date >= blog_post_date:
            self.set_error(errors.DONATE_ACCOUNT_NOT_ELIGIBLE, field='eligible')
            return False
        return True
