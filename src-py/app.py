
from flask_cors import CORS
from flask import Flask, jsonify,send_from_directory
import os
app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
CORS(app, resources={r"/*": {"origins": "*"}})
@app.route("/preview/<path:subpath>")
def preview_image(subpath):
    path = subpath.split("?")[0]
    if path == "":
        return jsonify({"status": "err", "message": "No path"})
    exts = ["png", "jpg", "jpeg", "webp", "gif"]
    ext = "png"
    try:
        if not path:
            return jsonify({"status": "err", "message": "Not a valid directory"})
        files_list = os.listdir(path)
        for i in exts:
            ext = i
            if ("preview." + ext) in files_list:
                break
    except Exception as e:
        return jsonify({"status": "err", "message": "Not a valid directory"})
    return send_from_directory(path, "preview." + ext)

app.run(host="0.0.0.0", port=5000)