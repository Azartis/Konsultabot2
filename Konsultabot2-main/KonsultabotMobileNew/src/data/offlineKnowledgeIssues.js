export const ISSUE_LIBRARY = [
  {
    id: 1,
    key: 'forgotten_password',
    title: 'Forgotten password',
    keywords: [
      'forgot password',
      'reset password',
      'lost password',
      'password reset',
      'cant remember password'
    ],
    summary: 'Use the self-service reset options first before requesting a manual reset.',
    steps: [
      'Click “Forgot Password” on the login screen and open the reset link sent to your EVSU email.',
      'Confirm your identity with recovery email/phone or security questions.',
      'Disable Caps Lock, check your keyboard layout, then enter the new password twice.',
      'Update any password manager or saved credentials once access is restored.'
    ],
    escalation: 'Visit the IT help desk with a valid ID if the reset email never arrives or multi-factor codes fail.'
  },
  {
    id: 2,
    key: 'account_locked',
    title: 'Account locked',
    keywords: [
      'account locked',
      'too many attempts',
      'locked out',
      'unlock account'
    ],
    summary: 'Accounts lock after repeated failed attempts to protect you.',
    steps: [
      'Wait 15–30 minutes before retrying so the lockout counter can reset.',
      'Use the official password reset workflow to set a fresh password.',
      'Double-check that Caps Lock is off and the username/email is correct.',
      'Contact IT support to manually unlock the account if automatic unlock fails.'
    ],
    escalation: 'Escalate when lockouts happen repeatedly even with correct credentials.'
  },
  {
    id: 3,
    key: 'lost_credentials',
    title: 'Lost login credentials',
    keywords: [
      'lost login',
      'lost credentials',
      'cant find username',
      'forgot username'
    ],
    summary: 'Recover usernames and stored passwords through official channels only.',
    steps: [
      'Search your email for the account activation message that contains your username.',
      'Check any approved password manager or secure note where you may have saved the details.',
      'If nothing turns up, request credential recovery from IT with a valid ID.',
      'After recovery, store the new credentials in a secure manager to avoid repeats.'
    ],
    escalation: 'Report suspected credential theft immediately so IT can force a reset.'
  },
  {
    id: 4,
    key: 'software_wont_run',
    title: 'Software won’t run',
    keywords: [
      'software wont run',
      'program wont open',
      'application wont start',
      'app not launching'
    ],
    summary: 'Verify system requirements and installation files before reinstalling.',
    steps: [
      'Compare your device specs with the software’s minimum requirements.',
      'Run the program as administrator and disable third-party overlays temporarily.',
      'Reinstall the application using the latest installer and reboot afterward.',
      'Check Event Viewer or application logs for clues if it still refuses to launch.'
    ],
    escalation: 'Escalate if licensed software refuses to run after a clean reinstall.'
  },
  {
    id: 5,
    key: 'application_errors',
    title: 'Application errors',
    keywords: [
      'application error',
      'app error',
      'runtime error',
      'software crash'
    ],
    summary: 'Most application errors resolve after updates and cache cleanup.',
    steps: [
      'Install pending updates for the application and your operating system.',
      'Clear temporary files or cached data the app stores.',
      'Disable conflicting add-ins or extensions and relaunch.',
      'Capture the exact error code/message for IT if it persists.'
    ],
    escalation: 'Escalate when critical business apps crash after every launch.'
  },
  {
    id: 6,
    key: 'missing_features',
    title: 'Missing software features',
    keywords: [
      'missing feature',
      'feature not available',
      'cant find option',
      'grayed out option'
    ],
    summary: 'Features can be hidden by edition, permissions, or outdated builds.',
    steps: [
      'Confirm you are signed in with a license that includes the feature.',
      'Check whether the organization disabled the option through policy.',
      'Update the software to the newest release where the feature exists.',
      'Review official documentation to ensure you are in the correct mode/view.'
    ],
    escalation: 'Escalate when licensed capabilities remain missing after policy review.'
  },
  {
    id: 7,
    key: 'computer_wont_turn_on',
    title: 'Computer won’t turn on',
    keywords: [
      'computer wont turn on',
      'pc wont start',
      'no power',
      'dead laptop',
      'black screen power'
    ],
    summary: 'Rule out power, battery, and display issues before assuming hardware failure.',
    steps: [
      'Verify the outlet or power strip works by testing with another device.',
      'Reseat or replace the power cable/adapter and remove the battery for 30 seconds if removable.',
      'Disconnect all peripherals and hold the power button for 10 seconds to discharge.',
      'Try an external monitor or brightness keys in case the display is the culprit.'
    ],
    escalation: 'Escalate if there is still no response or you hear beeps indicating hardware faults.'
  },
  {
    id: 8,
    key: 'slow_computer',
    title: 'Slow computer performance',
    keywords: [
      'slow computer',
      'pc lagging',
      'performance issue',
      'computer freezing'
    ],
    summary: 'Lightweight cleanup usually revives sluggish machines.',
    steps: [
      'Close unused tabs/programs and restart the device to clear memory.',
      'Check Task Manager for apps hogging CPU, RAM, or disk.',
      'Ensure at least 15% free disk space and run Disk Cleanup.',
      'Perform a malware scan and install pending OS/driver updates.'
    ],
    escalation: 'Escalate if slowness persists even in Safe Mode or after a clean boot.'
  },
  {
    id: 9,
    key: 'overheating',
    title: 'Overheating devices',
    keywords: [
      'overheating',
      'too hot',
      'thermal shutdown',
      'fan loud',
      'device hot'
    ],
    summary: 'Keep vents clear and monitor temps to avoid thermal throttling.',
    steps: [
      'Power down, unplug, and clean vents/fans with compressed air.',
      'Ensure the device sits on a hard surface or cooling pad, not fabric.',
      'Update BIOS/firmware and graphics drivers that control fan curves.',
      'Use hardware monitor apps to verify temperatures stay below safe limits.'
    ],
    escalation: 'Escalate if the device still overheats at idle or shuts down instantly.'
  },
  {
    id: 10,
    key: 'unrecognized_usb',
    title: 'Unrecognized USB device',
    keywords: [
      'usb not recognized',
      'device descriptor failed',
      'usb malfunctioned',
      'usb not detected'
    ],
    summary: 'Ports, drivers, or the accessory itself may be failing.',
    steps: [
      'Try another USB port and cable, preferably on a different computer.',
      'Open Device Manager, uninstall the faulty USB entry, then scan for hardware changes.',
      'Update chipset and USB controller drivers from the manufacturer.',
      'Inspect the USB connector for bent pins or debris.'
    ],
    escalation: 'Escalate if critical peripherals stay undetected across multiple machines.'
  },
  {
    id: 11,
    key: 'printer_not_working',
    title: 'Printer not working',
    keywords: [
      'printer not working',
      'cant print',
      'printer offline',
      'printing failed'
    ],
    summary: 'Most printer issues trace back to power, queue, or connectivity.',
    steps: [
      'Confirm the printer is powered on, connected, and shows no hardware errors.',
      'Clear the print queue from Devices & Printers and restart the spooler.',
      'Run the manufacturer’s diagnostic tool to reinstall/repair drivers.',
      'Print a test page locally before attempting network jobs again.'
    ],
    escalation: 'Escalate if the printer shows hardware faults or repeated paper jams.'
  },
  {
    id: 12,
    key: 'slow_internet',
    title: 'Slow internet connection',
    keywords: [
      'slow internet',
      'slow wifi',
      'internet lag',
      'bandwidth issue'
    ],
    summary: 'Check both the local device and network gear before blaming the ISP.',
    steps: [
      'Restart the modem/router and keep it ventilated.',
      'Run a speed test wired and wireless to compare throughput.',
      'Limit background downloads/streams and pause cloud backups.',
      'Switch Wi-Fi channels or move closer to the router to reduce interference.'
    ],
    escalation: 'Escalate to the ISP/IT if speeds stay far below the subscribed plan on multiple devices.'
  },
  {
    id: 13,
    key: 'lost_wifi_connection',
    title: 'Lost Wi-Fi connection',
    keywords: [
      'lost wifi',
      'cant connect wifi',
      'wifi keeps dropping',
      'wifi disconnected'
    ],
    summary: 'Rejoin trusted networks and reapply saved credentials.',
    steps: [
      'Toggle airplane mode or Wi-Fi off/on to refresh the adapter.',
      'Forget the network, reboot, then reconnect using the correct password.',
      'Restart the router or confirm there is no campus-wide outage.',
      'Update Wi-Fi adapter drivers or reset network settings as a last resort.'
    ],
    escalation: 'Escalate if all SSIDs disappear or the adapter fails to enable.'
  },
  {
    id: 14,
    key: 'network_resource_access',
    title: 'Unable to access network resources',
    keywords: [
      'cannot access network',
      'shared drive unavailable',
      'network resource denied',
      'cant reach server'
    ],
    summary: 'Access problems usually stem from credentials, VPN, or permissions.',
    steps: [
      'Verify you are connected to the correct network or VPN profile.',
      'Use \\server\\share or ping the server to ensure it responds.',
      'Re-enter your domain credentials when prompted and ensure the account isn’t locked.',
      'Check if the resource was moved/renamed or if permissions changed.'
    ],
    escalation: 'Escalate when multiple resources fail or you suspect a network-wide outage.'
  },
  {
    id: 15,
    key: 'accidental_file_deletion',
    title: 'Accidental file deletion',
    keywords: [
      'deleted file',
      'accidentally deleted',
      'restore file',
      'recover file'
    ],
    summary: 'Act fast and avoid overwriting the disk.',
    steps: [
      'Check Recycle Bin/Trash and restore the file if available.',
      'Look in cloud storage “Deleted” folders or the company backup system.',
      'Stop saving new files to the same drive to prevent overwriting.',
      'Contact IT for professional recovery if the file is critical.'
    ],
    escalation: 'Escalate when no backups exist and the data is business-critical.'
  },
  {
    id: 16,
    key: 'unsaved_work',
    title: 'Unsaved work',
    keywords: [
      'unsaved work',
      'crash lost work',
      'document closed without saving'
    ],
    summary: 'Many apps keep auto-recovery files you can restore.',
    steps: [
      'Reopen the application; most prompt you with auto-recovered versions.',
      'Browse the program’s autosave/backup folder for temporary files.',
      'Enable autosave/backup options for the future once work is recovered.',
      'Consider collaborative tools that auto-save to the cloud.'
    ],
    escalation: 'Escalate when regulated data was lost and must be documented.'
  },
  {
    id: 17,
    key: 'missing_files',
    title: 'Missing files',
    keywords: [
      'missing files',
      'cant find files',
      'files disappeared',
      'folders gone'
    ],
    summary: 'Files may be hidden, synced elsewhere, or renamed.',
    steps: [
      'Use system search with part of the filename or file type filters.',
      'Show hidden files/folders and check different user profiles.',
      'Open your cloud sync client (OneDrive/Drive) to review recent changes.',
      'Restore from backup or previous versions if still missing.'
    ],
    escalation: 'Escalate if you suspect malicious deletion or ransomware.'
  },
  {
    id: 18,
    key: 'popups_and_spam',
    title: 'Pop-ups and spam',
    keywords: [
      'pop ups',
      'spam ads',
      'browser popups',
      'adware'
    ],
    summary: 'Clean browsers and run security scans.',
    steps: [
      'Uninstall unknown browser extensions and reset browser settings.',
      'Run a reputable anti-malware scan (Defender, Malwarebytes).',
      'Block notifications/pop-ups from suspicious sites.',
      'Educate users about avoiding “Allow notifications” traps.'
    ],
    escalation: 'Escalate if pop-ups persist after scans or redirect you to malicious sites.'
  },
  {
    id: 19,
    key: 'virus_infection',
    title: 'Suspected virus infection',
    keywords: [
      'virus infection',
      'malware detected',
      'computer infected',
      'ransomware'
    ],
    summary: 'Isolate the machine and run full scans.',
    steps: [
      'Disconnect from the network (unplug ethernet/disable Wi-Fi).',
      'Run a full antivirus/anti-malware scan with updated definitions.',
      'Quarantine or remove the detected files and reboot.',
      'Change passwords after cleaning and review suspicious activity.'
    ],
    escalation: 'Escalate immediately for ransomware or if the scan cannot remove the threat.'
  },
  {
    id: 20,
    key: 'phishing_attempts',
    title: 'Phishing attempts',
    keywords: [
      'phishing',
      'suspicious email',
      'scam link',
      'fake login'
    ],
    summary: 'Verify before you click or share credentials.',
    steps: [
      'Inspect the sender address, grammar, and link destinations carefully.',
      'Hover over links without clicking to preview the true URL.',
      'Report the email to IT/security and delete it.',
      'If you already clicked, change passwords and notify IT immediately.'
    ],
    escalation: 'Escalate every confirmed phishing attempt for threat-hunting.'
  },
  {
    id: 21,
    key: 'general_system_irregularities',
    title: 'General system irregularities',
    keywords: [
      'weird behavior',
      'system glitch',
      'random issue',
      'unknown problem'
    ],
    summary: 'Use general health checks when the issue doesn’t fit a category.',
    steps: [
      'Restart the application and device to clear temporary faults.',
      'Check for OS, driver, and firmware updates.',
      'Run built-in troubleshooters (Windows Troubleshoot, Disk Utility).',
      'Document the exact symptoms for a deeper investigation.'
    ],
    escalation: 'Escalate when the glitch repeats daily or affects multiple users.'
  },
  {
    id: 22,
    key: 'external_monitor_issues',
    title: 'External monitor/display issues',
    keywords: [
      'external monitor',
      'second screen',
      'monitor not working',
      'no signal monitor'
    ],
    summary: 'Verify input selection, cabling, and graphics settings.',
    steps: [
      'Check the cable/adapter for damage and reconnect firmly.',
      'Use the monitor’s input/source button to select the correct port.',
      'Press Win+P (Windows) or use Display Settings to extend/duplicate screens.',
      'Update graphics drivers or try another monitor/cable to isolate the fault.'
    ],
    escalation: 'Escalate if the GPU or docking station fails across multiple monitors.'
  },
  {
    id: 23,
    key: 'microphone_webcam_not_working',
    title: 'Microphone or webcam not working',
    keywords: [
      'microphone not working',
      'webcam not detected',
      'camera blocked',
      'mic muted'
    ],
    summary: 'Check privacy permissions and default device selections.',
    steps: [
      'Ensure no physical shutter switch or mute button is engaged.',
      'Open system privacy settings and allow apps to use the mic/camera.',
      'In conferencing apps, pick the correct input/output device.',
      'Update audio/video drivers or reinstall the conferencing app.'
    ],
    escalation: 'Escalate when built-in and USB devices both fail or firmware updates are required.'
  },
  {
    id: 24,
    key: 'software_updates_failing',
    title: 'Software updates failing',
    keywords: [
      'update failed',
      'cant update',
      'software update error',
      'windows update stuck'
    ],
    summary: 'Clear caches and retry updates with minimal background load.',
    steps: [
      'Restart the device and rerun the update installer.',
      'Free up disk space and delete temporary files.',
      'Run Windows Update Troubleshooter or the vendor’s repair tool.',
      'Download the standalone installer/manual patch if automatic updates fail.'
    ],
    escalation: 'Escalate when critical security patches fail repeatedly or show specific error codes.'
  },
  {
    id: 25,
    key: 'new_equipment_setup',
    title: 'New equipment setup',
    keywords: [
      'new equipment setup',
      'install printer',
      'new hardware install',
      'setup scanner'
    ],
    summary: 'Follow vendor guides and verify drivers.',
    steps: [
      'Unbox carefully and remove all packaging/locks before powering on.',
      'Connect to power/network as instructed and let firmware initialize.',
      'Install the latest drivers/utilities from the vendor site.',
      'Print/scan a test page or run the device’s self-test to confirm.'
    ],
    escalation: 'Escalate when new equipment shows hardware errors immediately.'
  },
  {
    id: 26,
    key: 'software_compatibility_issues',
    title: 'Software compatibility issues',
    keywords: [
      'compatibility issue',
      'incompatible software',
      'won’t run on os',
      'legacy app'
    ],
    summary: 'Use compatibility modes or supported versions.',
    steps: [
      'Check the vendor matrix for supported OS/browser versions.',
      'Run the app in compatibility mode or as administrator if it is legacy.',
      'Use virtualization or remote desktop to run the app on a supported OS.',
      'Plan upgrades/migrations if the software is truly unsupported.'
    ],
    escalation: 'Escalate when a mission-critical legacy app has no supported workaround.'
  },
  {
    id: 27,
    key: 'backup_restore_issues',
    title: 'Data backup and restore issues',
    keywords: [
      'backup failed',
      'restore failed',
      'cant restore data',
      'backup error'
    ],
    summary: 'Always test backups before you need them.',
    steps: [
      'Verify the backup destination has enough space and is reachable.',
      'Review backup logs for specific error codes or corrupt files.',
      'Run a small test restore to confirm the media works.',
      'Update backup software and re-run the job after fixing errors.'
    ],
    escalation: 'Escalate when production backups fail multiple nights or contain corrupt archives.'
  },
  {
    id: 28,
    key: 'printing_incorrect_forms',
    title: 'Printing in incorrect forms',
    keywords: [
      'printing wrong form',
      'incorrect template',
      'wrong layout print',
      'form printing issue'
    ],
    summary: 'Match the document template with the printer defaults.',
    steps: [
      'Select the correct form or template before hitting print.',
      'Ensure paper size/orientation matches the form requirements.',
      'Update printer drivers and check for firmware that handles specialty forms.',
      'Print to PDF first to confirm layout before using expensive stock.'
    ],
    escalation: 'Escalate when regulated forms must match strict layouts and continue misprinting.'
  },
  {
    id: 29,
    key: 'generic_error_messages',
    title: 'Generic error messages',
    keywords: [
      'error message',
      'unknown error',
      'something went wrong',
      'unexpected error'
    ],
    summary: 'Capture the code and reproduce the problem systematically.',
    steps: [
      'Write down the full error code/message and when it appears.',
      'Search the internal knowledge base or vendor site for that exact code.',
      'Update/reinstall the affected application or component.',
      'Collect logs/screenshots before escalating to higher-tier support.'
    ],
    escalation: 'Escalate for recurring errors with unique codes or when data loss occurs.'
  },
  {
    id: 30,
    key: 'app_installation_issues',
    title: 'App installation/store issues',
    keywords: [
      'cant install app',
      'app store error',
      'installation failed',
      'play store issue',
      'microsoft store issue'
    ],
    summary: 'Storage, connectivity, or permissions typically block installs.',
    steps: [
      'Confirm you have sufficient storage space and delete unused apps/files.',
      'Sign out/in to the app store and verify payment or school account status.',
      'Clear the store cache (e.g., Microsoft Store/Play Store reset).',
      'Temporarily disable antivirus/firewall if they block the installer (re-enable afterward).'
    ],
    escalation: 'Escalate when licensed apps fail to deploy via MDM/company portal.'
  },
  {
    id: 31,
    key: 'mobile_app_issues',
    title: 'Mobile app issues',
    keywords: [
      'mobile app not working',
      'app keeps crashing',
      'mobile app glitch',
      'phone app issue'
    ],
    summary: 'Refresh the mobile app and network stack.',
    steps: [
      'Force close the app, clear its cache/storage, then relaunch.',
      'Update both the app and mobile OS to the latest versions.',
      'Test on Wi-Fi and mobile data to rule out connectivity filters.',
      'Uninstall/reinstall; sign back in to refresh tokens.'
    ],
    escalation: 'Escalate when institution-specific mobile apps fail after reinstall.'
  },
  {
    id: 32,
    key: 'mobile_data_not_working',
    title: 'Mobile data not working',
    keywords: [
      'mobile data not working',
      'cellular data issue',
      'no data connection',
      'lte not working'
    ],
    summary: 'Validate the SIM, plan, and APN settings.',
    steps: [
      'Toggle airplane mode for 30 seconds, then toggle mobile data back on.',
      'Verify you have signal bars and that the account is paid/active.',
      'Reset network settings or re-enter the carrier APN.',
      'Test the SIM in another phone to rule out hardware issues.'
    ],
    escalation: 'Escalate to the carrier/IT if multiple devices lose data simultaneously.'
  },
  {
    id: 33,
    key: 'lost_or_stolen_device',
    title: 'Lost or stolen device',
    keywords: [
      'lost device',
      'stolen laptop',
      'missing phone',
      'device recovery'
    ],
    summary: 'Protect data first, then work on recovery.',
    steps: [
      'Use Find My Device/Find My iPhone to locate, lock, or erase the device.',
      'Change passwords for accounts signed in on the device.',
      'Report the loss to campus security and local authorities if necessary.',
      'Provide the device serial number to IT for asset tracking.'
    ],
    escalation: 'Escalate immediately for any device containing sensitive data.'
  },
  {
    id: 34,
    key: 'charging_issues',
    title: 'Charging issues',
    keywords: [
      'not charging',
      'charging problem',
      'battery not charging',
      'charger not working'
    ],
    summary: 'Eliminate cable, adapter, and port problems.',
    steps: [
      'Use the original charger/cable or a known-good replacement.',
      'Inspect the charging port for dust or damage and clean gently.',
      'Try a different outlet or power strip.',
      'Check battery health diagnostics; recalibrate or replace if degraded.'
    ],
    escalation: 'Escalate if the battery swells, overheats, or will not charge past a low percentage.'
  },
  {
    id: 35,
    key: 'remote_access_problems',
    title: 'Remote access problems',
    keywords: [
      'remote access issue',
      'cant connect vpn',
      'remote desktop failing',
      'rdp issue'
    ],
    summary: 'Remote sessions rely on VPN, credentials, and firewall rules.',
    steps: [
      'Verify VPN connection status and that your account has remote privileges.',
      'Confirm the destination computer is powered on and allows remote connections.',
      'Use the correct hostname/IP and ensure firewalls/routers allow the port.',
      'Test with another network to rule out ISP blocking.'
    ],
    escalation: 'Escalate when corporate VPN gateways show faults or you suspect credential revocation.'
  },
  {
    id: 36,
    key: 'multiple_monitor_config',
    title: 'Multiple monitor configuration problems',
    keywords: [
      'multiple monitors',
      'dual monitor issue',
      'display arrangement',
      'monitor alignment'
    ],
    summary: 'Detect displays and configure them in the OS.',
    steps: [
      'Use Display Settings (Windows/macOS) to “Detect” missing screens.',
      'Drag the monitor icons to match the physical layout for correct cursor travel.',
      'Check resolution/refresh-rate support for each monitor.',
      'Update GPU drivers or test each monitor individually.'
    ],
    escalation: 'Escalate if docks/GPUs fail to output to multiple displays despite known-good monitors.'
  },
  {
    id: 37,
    key: 'external_drive_not_detected',
    title: 'External hard drive not detected',
    keywords: [
      'external drive not detected',
      'usb drive missing',
      'hard drive not showing',
      'drive not assigned'
    ],
    summary: 'Drives may need a new letter or different cable.',
    steps: [
      'Try another USB port/cable and listen for drive spin-up noises.',
      'Open Disk Management (Windows) or Disk Utility (macOS) to see if the disk appears offline.',
      'Assign a drive letter or mount point if the disk is healthy.',
      'Run CHKDSK/First Aid to repair file system errors.'
    ],
    escalation: 'Escalate if the drive clicks, does not spin, or contains critical data.'
  },
  {
    id: 38,
    key: 'scanner_not_working',
    title: 'Scanner not working',
    keywords: [
      'scanner not working',
      'cant scan',
      'twain error',
      'scanner offline'
    ],
    summary: 'Scanners need correct drivers and software profiles.',
    steps: [
      'Check cables/network connectivity and power-cycle the scanner.',
      'Install the latest TWAIN/WIA drivers and vendor utilities.',
      'Use the scanner’s built-in panel to run a self-test.',
      'Configure the scanning software with the correct device profile.'
    ],
    escalation: 'Escalate when the scanner shows hardware faults or calibration errors.'
  },
  {
    id: 39,
    key: 'projector_not_displaying',
    title: 'Projector not displaying',
    keywords: [
      'projector not displaying',
      'projector no signal',
      'cant project',
      'hdmi projector issue'
    ],
    summary: 'Input selection and display mode are common culprits.',
    steps: [
      'Ensure the projector is on the correct HDMI/VGA input.',
      'Use Win+P / macOS display options to duplicate or extend the screen.',
      'Set the output resolution to something the projector supports (e.g., 1080p).',
      'Try another cable or adapter and check for lens caps or muted video.'
    ],
    escalation: 'Escalate if the projector shows lamp errors or shuts down immediately.'
  },
  {
    id: 40,
    key: 'slow_vpn',
    title: 'Slow VPN connection',
    keywords: [
      'slow vpn',
      'vpn lag',
      'vpn slow connection',
      'vpn latency'
    ],
    summary: 'VPN speed depends on local bandwidth and the remote gateway.',
    steps: [
      'Test your raw internet speed without the VPN to ensure the baseline is healthy.',
      'Switch to a different VPN gateway/region if available.',
      'Close bandwidth-heavy apps (streaming, large downloads) during the VPN session.',
      'Enable split tunneling if permitted so only work traffic uses the VPN.'
    ],
    escalation: 'Escalate when corporate VPN servers are overloaded or show outage alerts.'
  },
  {
    id: 41,
    key: 'unable_to_print_in_color',
    title: 'Unable to print in color',
    keywords: [
      'cant print in color',
      'printing black and white',
      'color printing issue',
      'color option missing'
    ],
    summary: 'Color jobs require the correct driver and cartridge levels.',
    steps: [
      'In printer preferences, make sure “Color” (not grayscale) is selected.',
      'Check ink/toner levels and replace low color cartridges.',
      'Run the printer’s color calibration/cleaning tool.',
      'Update/reinstall the printer driver if color profiles are missing.'
    ],
    escalation: 'Escalate when managed printers enforce mono-only policies unexpectedly.'
  },
  {
    id: 42,
    key: 'printing_error_messages',
    title: 'Error messages when printing',
    keywords: [
      'printing error',
      'printer error message',
      'status error printing',
      'print job failed'
    ],
    summary: 'Most errors clear after restarting the spooler and reloading drivers.',
    steps: [
      'Cancel all pending jobs and restart the Print Spooler service.',
      'Power-cycle the printer and verify paper/ink levels.',
      'Update firmware or reinstall the printer driver package.',
      'Print a simple document locally to test before large jobs.'
    ],
    escalation: 'Escalate when error codes indicate mechanical failures.'
  },
  {
    id: 43,
    key: 'bsod_windows',
    title: 'Blue Screen of Death (Windows)',
    keywords: [
      'bsod',
      'blue screen',
      'stop code',
      'system crash'
    ],
    summary: 'Stop codes point to driver, hardware, or OS corruption.',
    steps: [
      'Note the stop code and recent hardware/software changes.',
      'Update or roll back recently installed drivers.',
      'Run Windows Memory Diagnostic and CHKDSK.',
      'Install pending Windows updates or perform System Restore.'
    ],
    escalation: 'Escalate when BSODs continue daily or involve hardware faults.'
  },
  {
    id: 44,
    key: 'computers_running_hot',
    title: 'Computers running hot (general)',
    keywords: [
      'computer running hot',
      'pc hot',
      'laptop hot',
      'fan constantly on'
    ],
    summary: 'Sustained heat shortens component life.',
    steps: [
      'Clean vents/fans and ensure airflow around the device.',
      'Reduce background processes and consider undervolting/high-performance plan tweaks.',
      'Use cooling pads or elevate the laptop to improve airflow.',
      'Monitor temperatures and fan speeds with diagnostic tools.'
    ],
    escalation: 'Escalate if temperatures exceed manufacturer limits during light workloads.'
  },
  {
    id: 45,
    key: 'low_disk_space',
    title: 'Low disk space',
    keywords: [
      'low disk space',
      'storage full',
      'disk almost full',
      'need more space'
    ],
    summary: 'Free space keeps systems responsive.',
    steps: [
      'Run Disk Cleanup/Storage Sense and remove temporary files.',
      'Uninstall unused apps and delete duplicate large files.',
      'Move media/projects to external drives or cloud storage.',
      'Consider upgrading the drive or expanding storage quotas.'
    ],
    escalation: 'Escalate when regulated archives prevent deletion or storage upgrades are required.'
  },
  {
    id: 46,
    key: 'setting_up_new_printer',
    title: 'Setting up a new printer',
    keywords: [
      'setup new printer',
      'add printer',
      'install printer',
      'printer installation'
    ],
    summary: 'Follow vendor setup steps before sharing the printer.',
    steps: [
      'Connect the printer to power/network and wait for initialization.',
      'Install the newest drivers/software from the vendor site.',
      'Add the printer via IP address or discovery in the OS.',
      'Print a configuration/test page to confirm connectivity.'
    ],
    escalation: 'Escalate when enterprise print policies prevent registration.'
  },
  {
    id: 47,
    key: 'disk_fragmentation',
    title: 'Disk fragmentation',
    keywords: [
      'disk fragmentation',
      'defrag',
      'defragment drive',
      'optimize disk'
    ],
    summary: 'Fragmentation slows older HDDs.',
    steps: [
      'Open the Disk Defragmenter/Optimize Drives tool.',
      'Analyze the disk and schedule optimization during off-hours.',
      'Ensure at least 15% free space before defragging.',
      'For SSDs, use TRIM/optimization rather than defrag.'
    ],
    escalation: 'Escalate if disks show repeated corruption or SMART warnings.'
  }
];


