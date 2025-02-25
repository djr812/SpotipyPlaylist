import requests
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for
from dotenv import load_dotenv
import os
import json


load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
application = app