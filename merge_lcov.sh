#!/bin/bash
while read FILENAME; do
    LCOV_INPUT_FILES="$LCOV_INPUT_FILES -a \"$FILENAME\""
done < <( find $1 -name lcov.info -maxdepth 3 )

eval lcov "${LCOV_INPUT_FILES}" -o $1/$2