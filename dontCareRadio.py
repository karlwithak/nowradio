from flask import Flask, render_template, request, jsonify
import requests
# This file is the first that is called when someone goes to a page on our website.
# It looks at the url that they entered and decides what computation to do and what
#   template to show them.

app = Flask(__name__)
app.config['APP_NAME'] = "Don't Care Radio"

stations = {
    'soft-rock': ['67.212.189.19:8080', 'streaming.softnep.net:8083'],
    'hard-rock': ['67.213.213.143:8048', '77.74.192.50:8000'],
    'house': ['stream.house-radio.com', 'fire1.neradio.com'],
    'ambient': ['radio.108.pl:8002', '85.25.86.69:8100'],
}
request_header = {'User-Agent': 'Mozilla/5.0'}

'''['http://sc8.1.fm:8030/;?icy=http',
'http://stream.house-radio.com/;?icy=http',
'http://50.7.173.162:8014/;?icy=http'] '''

@app.route('/')
def render_landing():
    return render_template("play.html")


@app.route('/get-stations/')
def get_stations():
    sub_genre = request.args.get('subGenre', '')
    return jsonify(stations=stations[sub_genre])

if __name__ == '__main__':
    app.run()
