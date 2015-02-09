from flask import Flask, render_template, session, request, jsonify
from secrets import secret_key
from os import urandom
# This file is the first that is called when someone goes to a page on out website.
# It looks at the url that they entered and decided what computation to do and what
#   template to show them.

app = Flask(__name__)
app.config['APP_NAME'] = "Don't Care Radio"

stations = {
    'rock0': ['rock0Station0', 'rock0station1', 'rock0station2'],
    'rock1': ['rock1Station0', 'rock1station1', 'rock1station2'],
    'rock2': ['rock2Station0', 'rock2station1', 'rock2station2'],
    'pop0': ['pop0Station0', 'pop0station1', 'pop0station2'],
    'pop1': ['pop1Station0', 'pop1station1', 'pop1station2'],
    'pop2': ['pop2Station0', 'pop2station1', 'pop2station2'],
}

'''['http://sc8.1.fm:8030/;?icy=http',
'http://stream.house-radio.com/;?icy=http',
'http://50.7.173.162:8014/;?icy=http'] '''

@app.route('/')
def render_landing():
    return render_template("landing.html")


@app.route('/play/')
def render_play():
    if 'id' not in session:
        session['id'] = "hat"
    return render_template("play.html")


@app.route('/get-stations/')
def get_stations():
    sub_genre = request.args.get('subGenre', '')
    return jsonify(stations=stations[sub_genre])


if __name__ == '__main__':
    app.secret_key = secret_key
    app.run()
