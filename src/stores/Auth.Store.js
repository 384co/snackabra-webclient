const config = require('../lib/config.json');

const gapiConfig = {
    client_id: config.gapiClientToken,
    hosted_domain: 'heartofgoldmedtransport.com',
    fetch_basic_profile: true,
    scope: config.gapiScope,
    redirect_uri: 'https://hog-portal-dev.ngrok.io/'
};

const authStore = () => {
    return {
        authenticated: null,
        profile: ' Persons Name ',
        token: null,
        init() {
            let self = this;
            if (typeof window !== 'undefined') {
                window.gapi.load('client:auth2', () => {
                    if (!window.gapi.auth2.getAuthInstance()) {
                        window.gapi.auth2.init(gapiConfig)
                            .then((googleAuth) => {
                                if (self.onRefresh()) {
                                    const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
                                    self.onLogin(googleUser)

                                } else {
                                    self.authenticated = false;
                                }
                                // Listen for changes to current user.
                                console.log('googleAuth', googleAuth);
                                googleAuth.currentUser.listen(this.userChanged);
                                // add name here by finding it in Gapi
                                // set persons name
                                // self.profile = // window.gapi.auth2 name....
                            });
                    }
                });
            }
        },
        get authorized() {
            if (this.authenticated === true && this.token !== null) {
                return true;
            } else {
                return false;
            }
        },
        async onLogin(googleUser) {

            const signedUp = await this.isSignedUp(googleUser);
            if (signedUp.hasOwnProperty('enrolled') && !signedUp.enrolled) {
                window.gapi.auth2.getAuthInstance().grantOfflineAccess({
                    scope: gapiConfig.scope
                }).then(async (res) => {
                    this.signUp(res, googleUser)
                        .then((result) => {
                            if (result) {
                                this.authenticate(googleUser);
                            } else {
                                alert('Something went wrong with the enrollment process, please contact support.')
                            }
                        })
                        .catch(console.log)
                }).catch(() => {
                    alert('Please enable pop-ups for HoG Portal to continue.');
                });
            } else {
                await this.authenticate(googleUser);
            }


        },
        userChanged(args) {
            console.log('User changed', args.qc)
            if (args.qc.expires_in < 300) {
                window.gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
                const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
                this.authenticate(googleUser)
            }

        },
        async isSignedUp(googleUser) {
            const email = googleUser.getBasicProfile().getEmail();
            return await fetch(process.env.NEXT_PUBLIC_API_HOST + 'auth/verify', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    credentials: 'include'
                },
                body: JSON.stringify({email: email})
            }).then((resp) => {
                if (!resp.ok) {
                    throw new Error('HTTP error, status = ' + resp.status);
                }
                return resp.json();
            })
        },
        async signUp(refreshToken, googleUser) {
            //make call to backend with the authorization code
            const email = googleUser.getBasicProfile().getEmail();
            const firstName = googleUser.getBasicProfile().getGivenName();
            const lastName = googleUser.getBasicProfile().getFamilyName();
            return fetch(process.env.NEXT_PUBLIC_API_HOST + 'auth/enroll', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    credentials: 'include'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                    email: email,
                    first_name: firstName,
                    last_name: lastName
                })
            }).then((resp) => {
                if (!resp.ok || resp.status !== 200) {
                    throw new Error('HTTP error, status = ' + resp.status);
                } else {
                    return resp.json();
                }
            }).then((result) => {
                console.log(result);
                return true;
            }).catch((e) => {
                console.log(e)
                return false;
            })
            // return scClientConnector.client.query('signup.employee', {refresh_token: refreshToken, email});

        },
        async authenticate(googleUser) {
            //make call to backend with the authorization code
            const user = {
                authenticated: googleUser.isSignedIn(),
                user: {
                    name: googleUser.getBasicProfile().getName(),
                    email: googleUser.getBasicProfile().getEmail(),
                    token: googleUser.getAuthResponse().id_token
                }
            };

            fetch(process.env.NEXT_PUBLIC_API_HOST + 'auth/signin', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    credentials: 'include'
                },
                body: JSON.stringify(user)
            }).then((resp) => {
                if (!resp.ok) {
                    throw new Error('HTTP error, status = ' + resp.status);
                }
                return resp.json();
            }).then((result) => {
                this.authenticated = true;
                this.token = result.token;

            }).catch((e) => {
                console.log(e)
                alert('Authentication failed!');
            })

        },
        onLogout() {
            let self = this;
            let auth2 = window.gapi.auth2.getAuthInstance();
            auth2.signOut()
                .then(async () => {
                    // await scClientConnector.client.query('login.logout');
                    auth2.disconnect();
                    self.authenticated = false;
                });
        },
        onRefresh() {
            let auth = window.gapi.auth2.getAuthInstance();
            return auth.currentUser.get().isSignedIn();
        },
        responseErrorGoogle(err) {
            console.log('login did not work');
        }
    };
};

export default authStore;