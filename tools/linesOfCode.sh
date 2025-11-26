#!/bin/bash
cd ${0%/*}

cd ..
printf "Lines of code in /src (*.ts + *.tsx)\n"
( find ./src \( -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 cat ) | wc -l

printf "Lines of code in /src (*.css)\n"
( find ./src \( -name '*.css' \) -print0 | xargs -0 cat ) | wc -l

printf "Lines of code in /srv (*.ts)\n"
( find ./srv \( \( -not -path './srv/node_modules/*' \) -a -name '*.ts' \) -print0 | xargs -0 cat ) | wc -l