#!/bin/bash

filename='healthcheck.txt'
result=`cat $filename`
if [ "$result" -eq "0" ]; then
    exit 0
else
    exit 1
fi
