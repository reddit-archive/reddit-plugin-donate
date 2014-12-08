from r2.lib.validator import Validator


class VOrganization(Validator):
    def run(self, org_id):
        # TODO: validate based on json org database
        return org_id
