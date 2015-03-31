# Make sure to run ourGenreUpdater on the server after changing this file

genre_list = [
    ['electro%', 'techno%', 'drum and bass%', 'dub%', 'trance%'],
    ['party%', 'club%', 'dance%', 'edm%', 'house%', 'deep house%'],
    ['hip%', 'rap%', 'rnb%', 'r&b%'],
    ['jazz%', 'smooth jazz%', 'live jazz'],
    ['classical', 'classical music', 'classical,'],
    ['blues%'],
    ['country%'],
    ['rock%', 'classic rock%'],
    ['metal%', 'death metal%', 'hard rock%', 'heavy metal%'],
    ['alternative%', 'indie%'],
    ['folk%'],
    ['60s%', '70%', '80%', '90s%', 'classic hits%', 'oldies%', 'old time%'],
    ['reggae%', 'caribbean', 'tropical'],
    ['chill%', 'ambient%', 'downtempo%', 'lounge%']
]

genre_names = [
    'electro',
    'party',
    'hiphop',
    'jazz',
    'classical',
    'blues',
    'country',
    'rock',
    'metal',
    'alt',
    'folk',
    'oldies',
    'reggae',
    'chill'
]

assert len(genre_list) == len(genre_names)
