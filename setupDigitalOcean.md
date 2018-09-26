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
9. Install NginX




forever start start.js