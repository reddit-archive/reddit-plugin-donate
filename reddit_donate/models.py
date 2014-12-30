import json

from pycassa import types

from r2.lib.db import tdb_cassandra
from r2.lib.utils import Storage


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
    def nominate(cls, account, organization_data):
        org = Storage(organization_data)
        org._id36 = organization_data["EIN"]
        cls.create(account, [org])

    @classmethod
    def unnominate(cls, account, organization_data):
        org = Storage(organization_data)
        org._id36 = organization_data["EIN"]
        cls.destroy(account, [org])


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
        return json.loads(org_row.data)


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
        "default_validation_class": "LongType",
    }

    @classmethod
    def byPrefix(cls, prefix):
        stripped = prefix.strip()
        try:
            results = cls._cf.get(stripped, column_count=25)
        except tdb_cassandra.NotFound:
            return []
        return [(ein, display_name)
                for (score, display_name), ein in results.iteritems()]
