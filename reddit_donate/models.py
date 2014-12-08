import json

from r2.lib.db import tdb_cassandra


class DonationNominationsByAccount(tdb_cassandra.DenormalizedRelation):
    _use_db = True

    _read_consistency_level = tdb_cassandra.CL.QUORUM
    _write_consistency_level = tdb_cassandra.CL.QUORUM

    _write_last_modified = False
    _views = []

    @classmethod
    def value_for(cls, thing1, thing2):
        # TODO: store relevant details of the nomination here
        return json.dumps({})

    @classmethod
    def nominate(cls, account, organization):
        cls.create(account, [organization])
