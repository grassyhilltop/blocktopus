systemctl stop hostapd
systemctl disable hostapd
systemctl enable wpa_supplicant
systemctl start wpa_supplicant
wpa_cli reconfigure
wpa_cli select_network wlan0
udhcpc -i wlan0
