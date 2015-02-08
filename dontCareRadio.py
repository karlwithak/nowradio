from flask import Flask, render_template
# This file is the first that is called when someone goes to a page on out website.
# It looks at the url that they entered and decided what computation to do and what
#   template to show them.

app = Flask(__name__)


@app.route('/')
def hello_world():
    return render_template("landing.html")


if __name__ == '__main__':
    app.run()
