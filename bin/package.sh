#!/bin/bash
cd "$(dirname "$0")"
BASE=".."
SRC="$BASE/src"
ETC="$BASE/etc"
APP="$BASE/app"
NODE="$BASE/node_modules"
DEPLOY="$BASE/deploy/$1"
STGROOT="$DEPLOY/etc/stages"
STGETCFILE="$STGROOT/$1.json"
STGDIR="$STGROOT/$1"
STGDIRINDEXFILE="$STGDIR/index.json"
STGDIRPACKAGEFILE="$STGDIR/package.json"
SCRIPTPATH=`pwd -P`
PROJECTNAME="$(basename $(dirname "$SCRIPTPATH"))"
ZIPNAME="$PROJECTNAME-$1"
DEPLOYZIP="$ZIPNAME.zip"
echo "$ZIPNAME"

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
        echo "{\"environment\":\"$1\"}" > "$STGROOT/index.json"
    else
        if [ -f "$STGETCFILE" ]
        then
           TO="$STGROOT/index.json"
           FROM="$STGETCFILE"
        else
            if [ -f "$STGDIRINDEXFILE" ] || [ -f "$STGDIRPACKAGEFILE" ]
            then
               TO="$STGROOT"
               FROM="$STGDIR/*"
            fi
        fi

        if [ -n "$TO" ]
        then
            echo "Copying $1 Stage File(s)."
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