#!/usr/bin/env python
from setuptools import setup, find_packages

setup(name='reddit_donate',
    description='reddit donate',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        'r2',
    ],
    entry_points={
        'r2.plugin':
            ['donate = reddit_donate:Donate']
    },
    zip_safe=False,
)
