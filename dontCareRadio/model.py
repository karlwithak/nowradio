# Make sure to run ourGenreSetter on the server after changing this file

genre_list = [
    ['electro%', 'techno%'],
    ['house%', 'trance%'],
    ['party%', 'club%', 'dance%', 'edm%'],
    ['pop%', 'top40%', 'top 40%'],
    ['hip%', 'rap%'],
    ['rnb%', 'r&b%'],
    ['country%'],
    ['blues%'],
    ['rock%', 'classic rock%'],
    ['metal%', 'death metal%'],
    ['jazz%', 'smooth jazz%'],
    ['classical', 'clasical music'],
    ['chill%', 'ambient%', 'downtempo%', 'lounge%'],
    ['vari%', 'misc%', 'alternative%', 'mixed%', 'assorted']
]

genre_names = [
    'electro',
    'house',
    'party',
    'pop',
    'hiphop',
    'rnb',
    'country',
    'blues',
    'rock',
    'metal',
    'jazz',
    'classical',
    'chill',
    'misc'
]

assert len(genre_list) == len(genre_names)
