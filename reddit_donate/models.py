import json

from pycassa import types

from r2.lib import utils
from r2.lib.db import tdb_cassandra


MAX_COLUMNS = 150


class Organization(object):
    def __init__(self, data):
        self.data = data

    @property
    def _id(self):
        return self.data["EIN"]

    @property
    def _id36(self):
        return utils.to36(self._id)


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

    @classmethod
    def unnominate(cls, account, organization):
        cls.destroy(account, [organization])

    @classmethod
    def count(cls, account):
        try:
            return cls._cf.get_count(account._id36, max_count=MAX_COLUMNS)
        except tdb_cassandra.NotFound:
            return 0

    @classmethod
    def get_for(cls, account):
        try:
            columns = cls._cf.get(account._id36, column_count=MAX_COLUMNS)
        except tdb_cassandra.NotFound:
            return []
        else:
            return [int(ein, 36) for ein, data in columns.iteritems()]


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

    def _to_organization(self):
        return Organization(json.loads(self.data))

    @classmethod
    def byEIN(cls, ein_or_eins):
        eins, is_single = utils.tup(ein_or_eins, ret_is_single=True)
        org_row_or_rows = cls._byID(ein_or_eins)
        if not is_single:
            return [org_row._to_organization()
                    for org_row in org_row_or_rows.itervalues()]
        else:
            return org_row_or_rows._to_organization()


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
            results = cls._cf.get(stripped, column_count=MAX_COLUMNS)
        except tdb_cassandra.NotFound:
            return []
        return [Organization(json.loads(data)) for key, data in results.iteritems()]
