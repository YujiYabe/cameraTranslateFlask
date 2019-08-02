#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest

import main


class TestFlaskHello(unittest.TestCase):

    def setUp(self):
        main.app.testing = True
        self.app = main.app.test_client()

    def test_get(self):
        response = self.app.get('/')
        assert response.status_code == 200
        # assert response.data == 'Hello, World!'
        assert 'Hello, World!' in response.data.decode('utf-8')
        # print(response.data.decode('utf-8'))
        print()


if __name__ == '__main__':
    unittest.main()
