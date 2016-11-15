from shutil import copyfile
import os 

dir_path = os.path.dirname(os.path.realpath(__file__))

linkList = [
    "EvergreenPracticalJaguar",
    "EnthusiasticFatDragon",
    "FamousLazyCat",
    "BrokenGreenDog",
    "MaddeningWittyFish",
    "FemaleRareHeifer",
    "BlackDwarfGiraffe",
    "QuestionableStereotypedHamster",
    "AnxiousColdCheetah",
    "ColorfulAnnoyingLamb",
    "ToxicFlashyChinchilla",
    "TastyPaleOx",
    "GiganticBrightCrocodile",
    "GruesomePoliticalHorse",
    "WearySnobbishOctopus"
]

src = dir_path + "\\index.html"
for val in linkList:
    dst = dir_path + "\\" + val + ".html"
    copyfile(src, dst)
