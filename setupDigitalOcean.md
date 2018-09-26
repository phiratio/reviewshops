# Digital ocean setup
### After you get your droplet and login with shh into it do the following:
1. `npm install n -g`
2. Pick a dir for your project and clone it into it `git clone https://www.github.com/phiratio/reviewshops`
3. `cd` into it and `npm install --only=prod`
4. Get your _**variables.env**_ file from the password protected archive into projects dir
5. `npm install forever -g`
6. `adduser bob` then `usermod -aG bob` optional make ssh key for this user only: `ssh-keygen` > `su - bob` > `cd ~` > `mkdir .ssh` > `chmod 700 .ssh` > `nano .ssh/authorized_keys` > insert the public key > `chmod 600 .ssh/authorized_keys` > now disable password login `sudo nano /etc/ssh/sshd_config` > PasswordAuthentication no,PubkeyAuthentication yes, ChallengeResponseAuthentication no > `sudo systemctl reload sshd`
7. Setup firewall: `sudo ufw app list` > `sudo ufw allow OpenSSH` > `sudo ufw enable` > `sudo ufw status` (should be active)
8. Setup your DNS. This will not be explained here. You can use cloudflare instead of DigitalOcean's DNS.
9. Install NginX: `sudo apt-get update` > `sudo apt-get install nginx` > `sudo ufw app list` > `sudo ufw allow 'Nginx HTTP'` > `sudo ufw status` > `systemctl status nginx`. You need to know your server's IP for further configuration > `ip addr show eth0 | grep inet | awk '{ print $2; }' | sed 's/\/.*$//'`. NginX is now installed. You can check it on http://your server IP address or domain. Now lets setup server blocks: 
 `sudo mkdir -p /var/www/SITE.DOMAIN/html` ,
 `sudo chown -R $USER:$USER /var/www/SITE.DOMAIN/html` ,
 `sudo chmod -R 755 /var/www/SITE.DOMAIN` ,
 `nano /var/www/SITE.DOMAIN/html/index.html`  : type `<html>it works</html>` , then `sudo nano /etc/nginx/sites-available/SITE.DOMAIN` and type this:    
 server {
         listen 80;
         listen [::]:80;
 
         root /var/www/SITE.DOMAIN/html;
         index index.html index.htm index.nginx-debian.html;
 
         server_name SITE.DOMAIN www.SITE.DOMAIN;
 
         location / {
                 try_files $uri $uri/ =404;
         }
 }

Then: `sudo ln -s /etc/nginx/sites-available/SITE.DOMAIN /etc/nginx/sites-enabled/`
Then: `sudo nano /etc/nginx/nginx.conf` > remove # from server_names_hash_bucket_size. Check if all is good `nginx -t`
  restart: `sudo systemctl restart nginx`. Check if when opening site.domain it shows it works

1. Lets encrypt free SSL with NginX: 
`sudo nano /etc/nginx/sites-available/SITE.DOMAIN` should be available. If yes `sudo ufw allow 'Nginx Full'`. Now: `sudo certbot --nginx -d SITE.DOMAIN -d www.SITE.DOMAIN`.Good now final check, if there are no errors we are all set `sudo certbot renew --dry-run`. More info on certbot [here](https://certbot.eff.org/docs/).
2. Now we must choose pm2 or forever to run our node app.I'll choose pm2. `cd` to your node app and `pm2 start index.js`. Now `pm2 startup systemd`.Now `systemctl start pm2-root.service`.
3. Cleanup our serverblocks `rm /etc/nginx/sites-available/SITE.DOMAIN /etc/nginx/sites-enabled/SITE.DOMAIN`
4. Now the tricky part. I revert from pm2 to forever because of it's simpler usage. `nano /etc/nginx/sites-available/default` uncomment ssl configuration lines > server name _; change to `server name DOMAIN.NAME www.DOMAIN.NAME;` set location as follows:
5. location / {
                   # First attempt to serve request as file, then
                   # as directory, then fall back to displaying a 404.
                   # try_files $uri $uri/ =404;
                   proxy_pass http://127.0.0.1:7777;
                   proxy_http_version 1.1;
                   proxy_set_header Upgrade $http_upgrade;
                   proxy_set_header Connection 'upgrade';
                   proxy_set_header Host $host;
                   proxy_cache_bypass $http_upgrade;
           }
6. then after that fix your ssl         add this below server name: >>>
        # force redirect http to https above for cloudflare
        if ($http_x_forwarded_proto = "http") {
                return 301 https://$server_name$request_uri;
        }

forever start start.js