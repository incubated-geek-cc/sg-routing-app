#!/bin/bash

function pause(){
   read -p "$*"
}

npm run start

pause 'Press [Enter] key to continue...'

