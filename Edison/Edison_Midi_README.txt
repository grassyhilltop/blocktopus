*If you end up in reboot cycle
	- check that battery level is ok (or switch to USB cable power)
	- "press enter a bunc to get to boot command prompt"
	- "run do_ota"

0)Terminal access over USB cable
- Note that board has two usb ports - one for power and another for data.
- board needs to be powered in order to access over usb (by USB or battery)

(run command from laptop terminal for terminal access over USB )
> screen /dev/tty.usbserial-A502LTRL 115200 -L


1) Flash Edison
https://communities.intel.com/docs/DOC-23193?_ga=1.127175885.1380266171.1406586957
-download files
-change drive to fat32 in disk utility
-copy files over
-connect over usb serial and do "ota reboot"

2) Configure Edison/Wifi
https://communities.intel.com/docs/DOC-23148
-Type “screen /dev/cu.usbserial” and press “Tab” on your keyboard.
-Now continue typing “115200 -L”.
-Type in “root” and press Enter.
-Type in “configure_edison --setup" and press Enter. 

to only setup wifi type:
	> configure_edison --wifi

	After Should see something like :
	Done. Please connect your laptop or PC to the same network as this device and go 	to http://10.0.1.9 or http://bloctopus2.local in your browser.

3) Get extra packages (git, etc)
https://communities.intel.com/message/252365

The IoT Devkit has a yocto repo up here
 
http://iotdk.intel.com/repos/1.1/iotdk/
 
I have had great success installing 'missing' packages (git,bison,flex,alsa-utils, etc) from this repo (everything seems to work ok). All you have to do is add the following /etc/opkg/base-feeds.conf

src/gz all http://repo.opkg.net/edison/repo/all
src/gz edison http://repo.opkg.net/edison/repo/edison
src/gz core2-32 http://repo.opkg.net/edison/repo/core2-32

NOTE : if you want to use the original intel repos put these lines instead
src all     http://iotdk.intel.com/repos/1.1/iotdk/all
src x86 http://iotdk.intel.com/repos/1.1/iotdk/x86
src i586    http://iotdk.intel.com/repos/1.1/iotdk/i586
 
then run
 
opkg update
opkg install git

4) Install Alsa
http://alextgalileo.altervista.org/blog/install-kernel-from-repo-onto-edison-official-image/

- opkg install alsa-dev
- opkg install alsa-lib
- opkg install alsa-utils
- opkg install alsa-lib-dev
- opkg install libasound2
- opkg install kernel-modules

Batch install (You can paste this single line instead):
opkg install alsa-dev;opkg install alsa-lib;opkg install alsa-utils;opkg install alsa-lib-dev;opkg install libasound2;opkg install kernel-modules

> npm install midi -g (if this works then packages were installed ok. note global -g flag )

5) Clone bloctopus repo
git clone https://github.com/grassyhilltop/blocktopus.git


6) Remotely connect from computer over SSH Wifi
ssh root@10.0.1.9 <ip address of edison>
open browser to 10.0.1.9:3000

7) Run setup script to be a wifi hot spot
hotspot_startup.sh


8) Setup node to run automatically on startup
Used this: http://stephaniemoyerman.com/?p=41
Create a file /etc/init.d/onstart.sh
Contents:
	#!/bin/sh
	cd  FILEPATH TO NODE ;npm start&
(note the ampersand to run in the background)

RUN >  update-rc.d onstart-octoweb.sh defaults


9) Copying files 
scp -r octoWebExpress/ root@bloctopus2.local:~


If you get Out of space error 
https://communities.intel.com/thread/59289
QUICK FIX : Remove log files :>  rm -rf /var/log/journal/*
