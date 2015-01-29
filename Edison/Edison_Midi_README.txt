*If you end up in reboot cycle
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

src all     http://iotdk.intel.com/repos/1.1/iotdk/all
src x86 http://iotdk.intel.com/repos/1.1/iotdk/x86
src i586    http://iotdk.intel.com/repos/1.1/iotdk/i586
 
then run
 
opkg update
opkg install git

4) Install Alsa
http://alextgalileo.altervista.org/blog/install-kernel-from-repo-onto-edison-official-image/

Put this in /etc/opkg/base_feeds.conf

src/gz all http://repo.opkg.net/edison/repo/all
src/gz edison http://repo.opkg.net/edison/repo/edison
src/gz core2-32 http://repo.opkg.net/edison/repo/core2-32

- opkg install alsa-dev
- opkg install alsa-lib
- opkg install alsa-utils
- opkg install alsa-lib-dev
- opkg install libasound2
- opkg install kernel_modules

-npm install midi (if this works then packages were install ok )

5) Clone bloctopus repo
git clone https://github.com/grassyhilltop/blocktopus.git


6) Remotely connect from computer over SSH Wifi
ssh root@10.0.1.9 <ip address of edison>
open browser to 10.0.1.9:3000


kShould we be worried ?
“- opkg install kernel_modules” failed with:
root@bloctopus2:~# opkg install kernel_modules
Unknown package 'kernel_modules'.
Collected errors:
 * opkg_install_cmd: Cannot install package kernel_modules.

CXX(target) Release/obj.target/midi/src/node-midi.o
SOLINK_MODULE(target) Release/obj.target/midi.node
/usr/lib/gcc/i586-poky-linux/4.8.2/../../../../i586-poky-linux/bin/ld: cannot find -lasound
collect2: error: ld returned 1 exit status
midi.target.mk:112: recipe for target 'Release/obj.target/midi.node' failed
make: *** [Release/obj.target/midi.node] Error 1
make: Leaving directory '/usr/lib/node_modules/midi/build'
