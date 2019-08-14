#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, render_template, jsonify, request

# Imports the Google Cloud client library
from google.cloud import vision
from google.cloud import translate

app = Flask(__name__)


# ALLOWED_EXTENSIONS = set(["png", "jpg", "jpeg", "gif"])


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/translate", methods=["POST"])
def trnslt():
    # check text
    if not request.form["text"] or not request.form["target"]:
        return (jsonify({"error": "text or target not specified"}), 400)

    text = request.form["text"]
    target = request.form["target"]

    # Instantiates a client
    translate_client = translate.Client()

    translation = translate_client.translate(text, target_language=target)

    return (jsonify({"translatedText": translation["translatedText"]}), 200)


@app.route("/scan", methods=["POST"])
def scan():
    # check upload file
    if "img_file" not in request.files:
        return (jsonify({"error": "file not exist"}), 400)

    img_file = request.files["img_file"]

    # # check extension
    # if not allwed_file(img_file.filename):
    #     return (jsonify({"error": "file not image"}), 400)

    # Detects text in the file.
    client = vision.ImageAnnotatorClient()

    content = img_file.read()

    image = vision.types.Image(content=content)

    response = client.text_detection(image=image)
    texts = response.text_annotations

    # check not include text
    if not texts:
        return (jsonify({"error": "not include text"}), 400)

    locale = texts[0].locale
    description = texts[0].description.rstrip("\n")

    return (jsonify({"locale": locale, "description": description}), 200)


# def allwed_file(filename):
#     # 画像ファイルの拡張子チェック
#     checkstatus = (
#         "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
#     )
#     return checkstatus


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
