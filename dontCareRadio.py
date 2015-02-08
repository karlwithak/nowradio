from flask import Flask, render_template
# This file is the first that is called when someone goes to a page on out website.
# It looks at the url that they entered and decided what computation to do and what
#   template to show them.

app = Flask(__name__)
app.config['APP_NAME'] = "Don't Care Radio"


@app.route('/')
def render_landing():
    return render_template("landing.html")


@app.route('/play')
@app.route('/play/')
def render_play():
    return render_template("play.html")


if __name__ == '__main__':
    app.run()
