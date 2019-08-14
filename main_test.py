#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest
import main
import json
import io


class TestFlask(unittest.TestCase):
    def setUp(self):
        main.app.testing = True
        self.app = main.app.test_client()

    def tearDown(self):
        # 終了処理
        pass

    def test_root_method(self):
        # POST GET PUT DELETE
        response = self.app.get("/")
        assert response.status_code == 200

        response = self.app.post("/")
        assert response.status_code == 405

        response = self.app.put("/")
        assert response.status_code == 405

        response = self.app.delete("/")
        assert response.status_code == 405

        # not include TRACE PATCH OPTIONS HEAD CONNECT

    # def test_translate_method(self):
    #     url = "/translate"

    #     data = {}
    #     data["text"] = "ごはん"
    #     data["target"] = "es"

    #     response = self.app.post(url, data=data)
    #     assert response.status_code == 200
    #     jsondata = json.loads(response.data.decode("utf-8"))
    #     assert jsondata["translatedText"] == "Arroz"

    #     # ■エラーケース
    #     # 変換対象言語がない場合
    #     data["text"] = ""
    #     data["target"] = "es"

    #     response = self.app.post(url, data=data)
    #     assert response.status_code == 400
    #     jsondata = json.loads(response.data.decode("utf-8"))
    #     assert jsondata["error"] == "text or target not specified"

    #     # 変換対象言語がない場合
    #     data["text"] = "ごはん"
    #     data["target"] = ""

    #     response = self.app.post(url, data=data)
    #     assert response.status_code == 400
    #     jsondata = json.loads(response.data.decode("utf-8"))
    #     assert jsondata["error"] == "text or target not specified"

    #     # ■■■■■■■■■■■■■■■■■

    # def test_scan_method(self):
    #     url = "/scan"
    #     # response = self.app.post(url)
    #     # assert response.status_code == 200

    #     response = self.app.get(url)
    #     assert response.status_code == 405

    #     response = self.app.put(url)
    #     assert response.status_code == 405

    #     response = self.app.delete(url)
    #     assert response.status_code == 405

    def test_scan_content(self):
        url = "/scan"
        filelocate = "resources/wakeupcat.jpg"
        # ###################################
        # 成功ケース
        with open(filelocate, "rb") as img1:
            img1StringIO = io.BytesIO(img1.read())

        response = self.app.post(
            url,
            content_type="multipart/form-data",
            data={"img_file": (img1StringIO, "img1.jpg")},
            follow_redirects=True,
        )

        jsondata = json.loads(response.data.decode("utf-8"))

        assert jsondata["description"] == "Wake up human!"
        assert jsondata["locale"] == "en"

        # ###################################
        # ■エラーケース

        # ________________
        # ファイルなし
        response = self.app.post(
            url, content_type="multipart/form-data", follow_redirects=True
        )
        assert response.status_code == 400
        jsondata = json.loads(response.data.decode("utf-8"))
        assert jsondata["error"] == "file not exist"

        # ________________
        # 画像以外
        # files = {"img_file": open("resources/text.txt", "rb")}
        # response = self.app.post(url, data=files)

        # assert response.status_code == 400
        # jsondata = json.loads(response.data.decode("utf-8"))
        # assert jsondata["error"] == "file not image"

        # ________________
        # テキストを抽出できない
        filelocate = "resources/not_include_text.jpg"

        with open(filelocate, "rb") as img1:
            img1StringIO = io.BytesIO(img1.read())

        response = self.app.post(
            url,
            content_type="multipart/form-data",
            data={"img_file": (img1StringIO, "img1.jpg")},
            follow_redirects=True,
        )

        assert response.status_code == 400
        jsondata = json.loads(response.data.decode("utf-8"))
        assert jsondata["error"] == "not include text"


if __name__ == "__main__":
    unittest.main()
