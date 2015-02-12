import sys
import unicodedata


SANITIZATION_MAPPING = dict.fromkeys(
    i for i in xrange(sys.maxunicode)
    if unicodedata.category(unichr(i)).startswith('P'))


def sanitize_query(name):
    return name.translate(SANITIZATION_MAPPING).lower().strip()


def normalize_query(name):
    return "".join(sanitize_query(name).split())
