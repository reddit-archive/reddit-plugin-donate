from r2.lib.db import tdb_cassandra
from r2.lib.errors import errors
from r2.lib.validator import VInt

from reddit_donate.models import DonationOrganization


class VOrganization(VInt):
    def run(self, ein_text):
        try:
            ein = int(ein_text)
            return DonationOrganization.byEIN(ein)
        except (ValueError, tdb_cassandra.NotFound):
            self.set_error(errors.DONATE_UNKNOWN_ORGANIZATION)
            return None
