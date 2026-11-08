#!/bin/bash
set -e

while getopts k:h:s: flag
do
  case "${flag}" in
    k) key=${OPTARG};;
    h) hostname=${OPTARG};;
    s) service=${OPTARG};;
  esac
done

if [[ -z "$key" || -z "$hostname" || -z "$service" ]]; then
  printf "\nMissing required parameter.\n"
  printf "  syntax: deployService.sh -k <pem key file> -h <hostname> -s <service>\n\n"
  exit 1
fi

if [[ ! -f "$key" ]]; then
  echo "SSH key not found: $key" >&2
  exit 1
fi
if [[ ! -f service/index.js || ! -f service/package.json ]]; then
  echo 'Run this script from the startup repository root; service/index.js must exist.' >&2
  exit 1
fi

printf "\n----> Building React frontend and Express backend\n"
rm -rf build
mkdir build
npm install
npm run build
cp -rf dist build/public
cp service/*.js build/
cp service/*.json build/

printf "\n----> Clearing old remote service directory\n"
ssh -i "$key" "ubuntu@$hostname" "rm -rf services/$service && mkdir -p services/$service"
printf "\n----> Copying frontend and backend to server\n"
scp -r -i "$key" build/* "ubuntu@$hostname:services/$service"
printf "\n----> Installing and restarting Express on server\n"
ssh -i "$key" "ubuntu@$hostname" << ENDSSH
bash -i
cd services/${service}
npm install
pm2 restart ${service}
ENDSSH
rm -rf build
rm -rf dist
printf "\n----> Finished deployment. Check https://${service}.${hostname}/api/health\n"
