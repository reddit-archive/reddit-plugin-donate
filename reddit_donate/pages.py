from r2.lib.pages import Reddit
from r2.lib.wrapped import Templated


class DonatePage(Reddit):
    extra_stylesheets = Reddit.extra_stylesheets + ["donate.less"]

    def __init__(self, title, content, **kwargs):
        Reddit.__init__(
            self,
            title=title,
            content=content,
            show_sidebar=False,
            **kwargs
        )


class DonateLanding(Templated):
    pass
