import json

from pycassa import types

from r2.lib.db import tdb_cassandra


class Organization(object):
    def __init__(self, data):
        self.data = data

    @property
    def _id36(self):
        return self.data["EIN"]


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
    def has_nominated(cls, account, organization):
        try:
            cls.fast_query(account, organization)
        except tdb_cassandra.NotFound:
            return False
        else:
            return True

    @classmethod
    def nominate(cls, account, organization):
        cls.create(account, [organization])

    @classmethod
    def unnominate(cls, account, organization):
        cls.destroy(account, [organization])

    @classmethod
    def count(cls, account):
        try:
            return cls._cf.get_count(account._id36, max_count=150)
        except tdb_cassandra.NotFound:
            return 0


class DonationOrganization(tdb_cassandra.Thing):
    _use_db = True

    _write_consistency_level = tdb_cassandra.CL.ALL
    _read_consistency_level = tdb_cassandra.CL.ONE

    _compare_with = "AsciiType"
    _value_type = "str"
    _extra_schema_creation_args = {
        "key_validation_class": "LongType",
        "default_validation_class": "UTF8Type",
    }

    @classmethod
    def byEIN(cls, ein):
        org_row = cls._byID(ein)
        return Organization(json.loads(org_row.data))


class DonationOrganizationsByPrefix(tdb_cassandra.View):
    _use_db = True
    _value_type = "bytes"  # disable tdb_cassandra's deserialization

    _write_consistency_level = tdb_cassandra.CL.ALL
    _read_consistency_level = tdb_cassandra.CL.ONE

    _compare_with = types.CompositeType(
        types.FloatType(reversed=True),
        types.UTF8Type(),
    )
    _extra_schema_creation_args = {
        "key_validation_class": "UTF8Type",
        "default_validation_class": "UTF8Type",
    }

    @classmethod
    def byPrefix(cls, prefix):
        stripped = prefix.strip()
        try:
            results = cls._cf.get(stripped, column_count=150)
        except tdb_cassandra.NotFound:
            return []
        return [json.loads(data) for key, data in results.iteritems()]
