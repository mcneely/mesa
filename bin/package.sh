#!/bin/bash
BASE=".."
SRC="$BASE/src"
ETC="$BASE/etc"
APP="$BASE/app"
NODE="$BASE/node_modules"
DEPLOY="$BASE/deploy"
ZIPNAME="MesaBuild"
DEPLOYZIP="$ZIPNAME.zip"
ENVROOT="$DEPLOY/etc"
ENVETCFILE="$ENVROOT/$1.json"
ENVDIR="$ENVROOT/$1"
ENVDIRFILE="$ENVDIR/index.json"

cd "$(dirname "$0")"
if [ -d "$DEPLOY" ]
then
   rm -rf "$DEPLOY"
fi
mkdir -p "$DEPLOY"
cp -rf -t "$DEPLOY" "$BASE"/*.js "$NODE" "$APP" "$SRC" "$ETC"

if [ -n "$1" ]
then
    if [ "$2" == "LINK" ]
    then
        echo "Creating Link File."
        echo "{\"environment\":\"$1\"}" > "$ETC/index.json"
    else
        if [ -f "$ENVETCFILE" ]
        then
           TO="$ENVROOT/index.json"
           FROM="$ENVETCFILE"
        else
            if [ -f "$ENVDIRFILE" ]
            then
               TO="$ENVROOT"
               FROM="$ENVDIR/*"
            fi
        fi

        if [ -n "$TO" ]
        then
            echo "Copying $1 Environment File(s)."
            COMMAND="cp -rf $FROM $TO"
            eval "$COMMAND"

            if [ "$2" == "CLEAN" ]
            then
                echo "Removing $FROM"
                rm -rf "$FROM"
            fi
        else
            echo "ERROR: Config for $1 not found."
            exit 1;
        fi
    fi
fi
echo "Building package."
cd $DEPLOY
zip -mr9 "$DEPLOYZIP" . > /dev/null
echo "Done."