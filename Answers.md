### 1. To disconnect an Active User from the Network
printf 'Acct-Session-Id = "SESSION_ID"\n' | radclient -x 10.8.0.14:3799 disconnect RADIUS_SHARED_SECRET

### 2. Describe how they should reach our cloud FreeRADIUS, and how RADIUS knows which kit sent a request.
The kits connect to our cloud server using a WireGuard VPN tunnel. Because most of them are behind CGNAT, this VPN lets them initiate the connection from their end, completely bypassing the need for a public IP.

### 3. Which domains must be in the captive portal's walled garden for an in-portal mobile-money purchase with SMS OTP to work, and why?
SMS OTP arrives through mobile network, so the use of internet is not necessary.

### 4. Minimal code for FreeRADIUS `sites-enabled/default` lines so both `authorize` and `accounting` call the `rest` module.
authorize {
    rest
}

accounting {
    rest
}

### 5. What should already-connected users and new users experience, and how do you configure that?
Already-connected users should not be automatically disconnected, they should remain online until the users session expires

New users should be restricted authorization access since the backend API verify authentication is down