# Install Node 8
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install -y yarn
yarn install
echo "PATH=\"$HOME/.yarn/bin:$PATH\"" >> "$HOME/.profile"

# Install PM2
yarn global add pm2

# Install ArangoDB
ARANGO_PASSWORD=${ARANGO_PASSWORD:-password}
echo arangodb3 arangodb3/password password "$ARANGO_PASSWORD" | debconf-set-selections
echo arangodb3 arangodb3/password_again password "$ARANGO_PASSWORD" | debconf-set-selections
echo arangodb3 arangodb3/password_mismatch error | debconf-set-selections
echo arangodb3 arangodb3/upgrade boolean true | debconf-set-selections
echo arangodb3 arangodb3/backup boolean false | debconf-set-selections
echo arangodb3 arangodb3/storage_engine select rocksdb | debconf-set-selections

curl -OL https://download.arangodb.com/arangodb33/xUbuntu_16.04/Release.key
sudo apt-key add - < Release.key
echo 'deb https://download.arangodb.com/arangodb33/xUbuntu_16.04/ /' | sudo tee /etc/apt/sources.list.d/arangodb.list
sudo apt-get install apt-transport-https
sudo apt-get update
sudo apt-get install arangodb3
