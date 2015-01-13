from __future__ import print_function, division

import csv
import json

from reddit_donate import models


MIN_PREFIX_LEN = 3
STOP_WORDS = ["the "]


def _generate_prefixes(display_name):
    sanitized = display_name.lower().strip()

    for prefix_len in xrange(MIN_PREFIX_LEN, len(sanitized)+1):
        yield sanitized[:prefix_len]

    for stop_word in STOP_WORDS:
        if sanitized.startswith(stop_word):
            unstopped = sanitized[len(stop_word):].strip()
            for prefix_len in xrange(MIN_PREFIX_LEN, len(unstopped)+1):
                yield unstopped[:prefix_len]


def _coerce_values(mapping, function, keys):
    for key in keys:
        value = mapping.get(key)
        if value:
            mapping[key] = function(value)


def load_charity_data(csv_filename):
    reader = csv.DictReader(open(csv_filename))

    org_batch = models.DonationOrganization._cf.batch()
    prefix_batch = models.DonationOrganizationsByPrefix._cf.batch()

    for i, row in enumerate(reader):
        if i % 10000 == 0:
            print("{: 5.2%} progress".format(i / 1497802))

        # coerce various values from the csv
        row = {k: unicode(v, "utf-8") for k, v in row.iteritems()}
        _coerce_values(row, int, ["EIN"])
        _coerce_values(row, float,
            ["OverallScore", "OverallRtg", "ATScore", "ATRtg"])

        serialized = json.dumps(row)
        org_batch.insert(row["EIN"], {"data": serialized})

        # we only do autocomplete for rated orgs as the master list has a huge
        # huge huge number of duplicate names etc.
        if row["OrgID"]:
            score = row["OverallScore"] or 0
            display_name = row["DisplayName"]

            for prefix in _generate_prefixes(display_name):
                prefix_batch.insert(prefix, {(score, display_name): serialized})
