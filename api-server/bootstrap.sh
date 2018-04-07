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

# Install Postgres
export PGPASSWORD="${PGPASSWORD:-password}"
sudo apt-get install -y postgresql
sudo -u postgres createdb t4
sudo -u postgres psql -c "CREATE ROLE t4 WITH LOGIN SUPERUSER PASSWORD '$PGPASSWORD';"
sudo sed -i -r -e 's/local(\s+)all(\s+)all(\s+)peer/local\1all\2all\3md5/' /etc/postgresql/9.5/main/pg_hba.conf
sudo systemctl restart postgresql
psql --username=t4 --dbname=t4 --echo-all --file=config/db-schema.sql
