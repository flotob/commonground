#!/bin/bash
cd ${0%/*}
THISPATH=$(pwd)
cd ../src

SVGS16=""
for svg in components/atoms/icons/16/*.svg; do
  FILENAME=$(basename "$svg")
  SVGS16="$SVGS16<tr><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$FILENAME</td><td><button onclick=\"navigator.clipboard.writeText('import { ReactComponent as ${FILENAME%.*}Icon } from \\'$svg\\';')\">Copy import statement</button></td></tr>"
done

SVGS20=""
for svg in components/atoms/icons/20/*.svg; do
  FILENAME=$(basename "$svg")
  SVGS20="$SVGS20<tr><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$FILENAME</td><td><button onclick=\"navigator.clipboard.writeText('import { ReactComponent as ${FILENAME%.*}Icon } from \\'$svg\\';')\">Copy import statement</button></td></tr>"
done

SVGS24=""
for svg in components/atoms/icons/24/*.svg; do
  FILENAME=$(basename "$svg")
  SVGS24="$SVGS24<tr><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$(cat $svg)</td><td>$FILENAME</td><td><button onclick=\"navigator.clipboard.writeText('import { ReactComponent as ${FILENAME%.*}Icon } from \\'$svg\\';')\">Copy import statement</button></td></tr>"
done

PRIM="#FF0000"
SECOND="#00CCCC"
COMPL="#770077"

cd $THISPATH
cat > iconOverview.html <<- EOF
<html>
<head>
<style type="text/css">
body {
  --iconPrimary: $PRIM;
  --iconSecondary: $SECOND;
  --iconComplementary: $COMPL;
}
td {
  text-align: left;
}
td:nth-child(1), td:nth-child(2), td:nth-child(3), td:nth-child(4) {
  text-align: center;
  vertical-align: center;
}
td:nth-child(4) {
  background-color: black;
}
td:nth-child(5), td:nth-child(6) {
  padding-left: 1rem;
}
td:nth-child(1) > svg, td:nth-child(2) > svg {
  height: 3rem;
  width: auto;
  transform-origin: left;
  transform-box: view-box;
}
td:nth-child(2) > svg {
  background-color: black;
}
td:nth-child(1) > svg, td:nth-child(2) > svg {
  display: block;
  border: 1px solid var(--iconPrimary);
}
</style>
</head>
<body>
  <h2 style="color: var(--iconPrimary)">--iconPrimary <input type="color" value="$PRIM" onchange="document.body.style.setProperty('--iconPrimary', this.value)"></h2>
  <h2 style="color: var(--iconSecondary)">--iconSecondary <input type="color" value="$SECOND" onchange="document.body.style.setProperty('--iconSecondary', this.value)"></h2>
  <h2 style="color: var(--iconComplementary)">--iconComplementary <input type="color" value="$COMPL" onchange="document.body.style.setProperty('--iconComplementary', this.value)"></h2>
  <table>
  <td colspan="6"><h1>16px icons</h1></td>
  $SVGS16
  <td colspan="6"><h1>20px icons</h1></td>
  $SVGS20
  <td colspan="6"><h1>24px icons</h1></td>
  $SVGS24
  </table>
</body>
</html>
EOF