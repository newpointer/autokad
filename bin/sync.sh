#!/bin/sh

DIR="$( cd "$( dirname "$0" )" && pwd )"

rsync -avz --delete $DIR/../dist/nkb-app/ deploy@testing0.nkb:/srv/www/autokad/
