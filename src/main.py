import json
from word import Word
from phrase import Phrase
from sentence import Sentence


def read_data(filename: str) -> list:
    elements = []
    try:
        with open(filename, "r") as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"ERROR: File '{filename}' not found.")
        exit(1)
    except json.JSONDecodeError:
        print("ERROR: Could not decode JSON data from file.")
        exit(1)
    for obj in data:
        l_eng = obj["l-eng"]
        l_turk = obj["l-turk"]
        if obj["type"] == "word":
            elem = Word(l_eng, l_turk)
        elif obj["type"] == "phrase":
            elem = Phrase(l_eng, l_turk)
        elif obj["type"] == "sentence":
            elem = Sentence(l_eng, l_turk)
        elements.append(elem)
    return elements


if __name__ == "__main__":
    elements = read_data("data/data.json")

    for elem in elements:
        elem.exercise()
