const functions = require('firebase-functions');
const express = require('express');
const app = express();
var path = require('path');

app.set('views', './views');
app.set('view engine', 'ejs');
const engine = require('ejs-locals');


var firebase = require("firebase");
var FirebaseAuth = require('firebase/auth');
var dateFormat = require('dateformat');

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




var config = {
    apiKey: "AIzaSyAZ55RNyB1Qmvufu99CfjXhlNCgLLGg1aE",
    authDomain: "kliit-health-app.firebaseapp.com",
    databaseURL: "https://kliit-health-app.firebaseio.com",
    projectId: "kliit-health-app",
    storageBucket: "kliit-health-app.appspot.com",
    messagingSenderId: "85922620112",
    appId: "1:85922620112:web:67901b0167a34869"

};
firebase.initializeApp(config);
var db = firebase.firestore();


app.get('/timestamp',(request,response)=>{
 response.send(`${Date.now()}`);

});

app.get('/loginForm', function(req, res, next) {
    res.render('template/loginForm');
});


app.get('/devicedetection', function(req, res, next) {
    res.render('template/devicedetection');
});

app.post('/loginChk', function(req, res, next) {
	console.log(req.body);
	if(req.body.id == 'info@kliithealth.com'){
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
       .then(function(firebaseUser) {
           res.redirect('index');
       })
      .catch(function(error) {
        res.redirect('userList');
      });    
  }else{
  	res.redirect('/loginForm');
  }
});
 

app.get('/index', function(req, res, next) {
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    db.collection('users').get()
    .then((snapshot) => {
		var row = [],row1 = [];
		var referral = {};
		var referrals = [];
		var referralReport = {};

        snapshot.forEach((doc) => {
            var childData = doc.data();
            if (childData.profileInfo != null) {
                if(childData.role == 'Expert'){
                    row.push(childData.profileInfo.firstName);
                }else{
					referrals.push({
						referralCode: childData.referalCode,
						referredCode: childData.referedCode,
						displayName: `${childData.profileInfo.firstName} ${childData.profileInfo.lastName} (${childData.profileInfo.email})`
					});

					row1.push(childData.profileInfo.firstName);
                }                
            }
		});

		const report = referrals.map(r => {
			const rr = {};
			rr.code = r.referralCode;
			rr.name = r.displayName;
			rr.count = 0;

			return rr;
		});

		const referreds = referrals.map(x => x.referredCode);

		report.forEach(r => {
			// see how many times 'code' is in the referrals array as 'referredCode'
			if (r.code) {
				r.count = referreds.filter(y => y === r.code).length;
			}
		});
		
		res.render('index', {expert: row, users: row1, report});
    })
    .catch((err) => {
        console.log('Error getting documents', err);
    });

});

app.get('/userList', function(req, res, next) {
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }
    
    db.collection('users').where('role', '==', 'Expert').get()
          .then((snapshot) => {
              var rows = [];
              snapshot.forEach((doc) => {
                  var childData = doc.data();
                  childData.usrdate = dateFormat(childData.usrdate, "yyyy-mm-dd");
                  rows.push(childData);
              });

              console.log(rows);
              res.render('template/userList', {rows: rows});
          })
          .catch((err) => {
              console.log('Error getting documents', err);
          });
});

app.get('/session', function(req, res, next) {
	if (!firebase.auth().currentUser) {
		res.redirect('loginForm');
		return;
	}

	db.collection("questionsNew").doc(req.query.ssnid).get()
		.then(doc => {
			// get message thread
			db.collection("messagesNew").doc(doc.data().messageId).collection("chat").orderBy("createdAt").get()
				.then(snapshot => {
					var messages = [];

					snapshot.forEach(x => {
						messages.push(x.data());
					});

					res.render("template/session", { question: doc.data(), messages: messages })
				});
		});
});

app.get('/sessions', function(req, res, next) {
	if (!firebase.auth().currentUser) {
		res.redirect('loginForm');
		return;
	}
	
	db.collection("questionsNew").orderBy("createdAt").get()
		.then(snapshot => {
			var sessions = [];

			snapshot.forEach(doc => {
				sessions.push(doc.data());
			});

			// render session template
			res.render("template/sessions", {rows: sessions});
		})

		.catch(err => {
			console.error("could not retrieve sessions from firestore", err);
		});
});

app.get('/patients', function(req, res, next) {
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }
    
    db.collection('users').where('role', '==', 'User').get()
          .then((snapshot) => {
              var rows = [];
              snapshot.forEach((doc) => {
                  var childData = doc.data();
                  childData.usrdate = dateFormat(childData.usrdate, "yyyy-mm-dd");
                  rows.push(childData);
              });

              console.log(rows);
              res.render('template/patients', {rows: rows});
          })
          .catch((err) => {
              console.log('Error getting documents', err);
          });
});


app.get('/userLogout', function(req,res,next){
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        res.redirect('loginForm');
      }).catch(function(error) {
        // An error happened.
      });
});

app.get('/userRead', function(req, res, next) {
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    
    db.collection('users').doc(req.query.usrno).get()
        .then((doc) => {
            var childData = doc.data();

            console.log(childData);
            
            childData.usrdate = dateFormat(childData.usrdate, "yyyy-mm-dd hh:mm");
            res.render('template/userRead', {row: childData});
        })
});

app.get('/patientRead', function(req, res, next) {
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }
    
    db.collection('users').doc(req.query.usrno).get()
        .then((doc) => {
            var childData = doc.data();

            console.log(childData);
            
            childData.usrdate = dateFormat(childData.usrdate, "yyyy-mm-dd hh:mm");
            res.render('template/userRead', {row: childData});
        })
});

app.get('/updateUser', async function(req,res,next){
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    let markers = [];
    let languagesdata = {};

    let professions = [];
    let professionsData = {};

    db.collection('languages').get()
    .then(async querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        languagesdata = doc.data();
        languagesdata.langId = doc.id;
        markers = [
            ...markers,
            languagesdata,
        ]
    });


    let activeRef = await db.collection('professions').get();
    for (campaign of activeRef.docs) {
        professionsData = campaign.data();
        professionsData.puid = campaign.id;
        professions = [
            ...professions,
            professionsData,
        ]
    }

        db.collection('users').doc(req.query.usrno).get()
        .then((doc) => {
            var childData = doc.data();

            res.render('template/updateUser', {row: markers, professions: professions,row1: childData});
        })
  });

});

app.post('/editSaveUser', async function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (!user) {
        res.redirect('loginForm');
        return;
    }

    try {
        var postData = req.body;
        let finalData = {};

                    finalData.uid = postData.uid;
                    finalData.rating = parseInt(postData.rating);
                    finalData.role = "Expert";
                    postData1 = {
                        ...postData
                    };
                    let abcd = postData1.hours;
                    let states = postData1.state;
                    let stateObj = {};
                    stateSplit = states.split("-");
                    stateObj.code = stateSplit[0];
                    stateObj.value = stateSplit[1];
                    postData1.state = stateObj;

                    let objKey = '';
                    let obbbb = {};
                    var size = 3;
                    var arrayOfArrays = [];
                    for (var i = 0; i < abcd.length; i += size) {
                        arrayOfArrays.push(abcd.slice(i, i + size));
                    }

                    var rv = [];
                    for (var i = 0; i < arrayOfArrays.length; ++i) {
                        // rv[i] = arrayOfArrays[i];
                        let arr = arrayOfArrays[i];
                        let obj = {
                            day: arr[0],
                            startTime: arr[1],
                            endTime: arr[2],
                        }
                        rv.push(obj);
                    }

                    postData1.hours = rv;

                    let professionsData = postData1.profession;
                    professionsDataSplit = professionsData.split('##');
                    professionObj = {};
                    professionObj.fullName = professionsDataSplit[1];
                    professionObj.shortName = professionsDataSplit[0];
                    professionObj.specialities = postData1.specialities;

                    postData1.profession = professionObj;
                    if (typeof (postData1['languages']) != 'string') {
                        let langvar = [];
                        for (var k = 0; k < postData1['languages'].length; ++k) {
                            await db.collection('languages').doc(postData1['languages'][k]).get()
                                .then((doc) => {
                                    langvar = [
                                        doc.data(),
                                        ...langvar,
                                    ]
                                })
                        }
                        postData1.languages = langvar;
                    } else {
                        await db.collection('languages').doc(postData1.languages).get()
                            .then((doc) => {
                                postData1.languages = doc.data();
                            })
                    }
                    let clinicInfo = {},
                        profileInfo = {};
                    for (var key in postData1) {
                        if (postData1.hasOwnProperty(key)) {
                            // console.log(key + ": " + postData1[key]);
                            if (key == 'name' || key == 'address' || key == 'phoneNumber' || key == 'city' || key == 'zipcode' || key == 'state' || key == 'hours') {
                                clinicInfo[key] = postData1[key];
                            }
                            if (key == 'bio' || key == 'dob' || key == 'email' || key == 'city' || key == 'firstName' || key == 'gender' || key == 'lastName' || key == 'languages' || key == 'profession' || key == 'state') {
                                profileInfo[key] = postData1[key];
                            }
                            profileInfo.profileImageUrl = "";
                        }
                    }
                    finalData.clinicInfo = clinicInfo;
                    finalData.profileInfo = profileInfo;
                    // doc.set(finalData);
                    var doc1 = db.collection("users").doc(postData.uid);
                    doc1.update(finalData);
               
                res.redirect('userList');
          
    } catch (error) {
        console.log(error);
    }
});

app.post('/userSave', async function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (!user) {
        res.redirect('loginForm');
        return;
    }

    try {
        var postData = req.body;
        let finalData = {};
        firebase.auth().createUserWithEmailAndPassword(postData.email, postData.password)
            .then(async function (user) {
                let expertUid = user.user.uid;
                if (!postData.uid) { // new
                    var doc = db.collection("users").doc(expertUid);
                    finalData.uid = expertUid;
                    finalData.rating = parseInt(postData.rating);
                    finalData.role = "Expert";
                    postData1 = {
                        ...postData
                    };
                    let abcd = postData1.hours;
                    let states = postData1.state;
                    let stateObj = {};
                    stateSplit = states.split("-");
                    stateObj.code = stateSplit[0];
                    stateObj.value = stateSplit[1];
                    postData1.state = stateObj;

                    let objKey = '';
                    let obbbb = {};
                    var size = 3;
                    var arrayOfArrays = [];
                    for (var i = 0; i < abcd.length; i += size) {
                        arrayOfArrays.push(abcd.slice(i, i + size));
                    }

                    var rv = [];
                    for (var i = 0; i < arrayOfArrays.length; ++i) {
                        // rv[i] = arrayOfArrays[i];
                        let arr = arrayOfArrays[i];
                        let obj = {
                            day: arr[0],
                            startTime: arr[1],
                            endTime: arr[2],
                        }
                        rv.push(obj);
                    }

                    postData1.hours = rv;

                    let professionsData = postData1.profession;
                    professionsDataSplit = professionsData.split('##');
                    professionObj = {};
                    professionObj.fullName = professionsDataSplit[1];
                    professionObj.shortName = professionsDataSplit[0];
                    professionObj.specialities = postData1.specialities;

                    postData1.profession = professionObj;
                    if (typeof (postData1['languages']) != 'string') {
                        let langvar = [];
                        for (var k = 0; k < postData1['languages'].length; ++k) {
                            await db.collection('languages').doc(postData1['languages'][k]).get()
                                .then((doc) => {
                                    langvar = [
                                        doc.data(),
                                        ...langvar,
                                    ]
                                })
                        }
                        postData1.languages = langvar;
                    } else {
                        await db.collection('languages').doc(postData1.languages).get()
                            .then((doc) => {
                             //   postData1.languages = doc.data();
                            var lan = [];
                            lan[0] = doc.data();
                            postData1.languages = lan;

                            })
                    }
                    let clinicInfo = {},
                        profileInfo = {};
                    for (var key in postData1) {
                        if (postData1.hasOwnProperty(key)) {
                            // console.log(key + ": " + postData1[key]);
                            if (key == 'name' || key == 'address' || key == 'phoneNumber' || key == 'city' || key == 'zipcode' || key == 'state' || key == 'hours') {
                                clinicInfo[key] = postData1[key];
                            }
                            if (key == 'bio' || key == 'dob' || key == 'email' || key == 'city' || key == 'firstName' || key == 'gender' || key == 'lastName' || key == 'languages' || key == 'profession' || key == 'state') {
                                profileInfo[key] = postData1[key];
                            }
                            profileInfo.profileImageUrl = "";
                        }
                    }
                    finalData.clinicInfo = clinicInfo;
                    finalData.profileInfo = profileInfo;
                    doc.set(finalData);
                } else { // update
                    var doc = db.collection("users").doc(postData.usrno);
                    doc.update(postData);
                }
                res.redirect('userList');
            }).catch(function (error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
});

app.get('/userDelete', function(req,res,next){
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }
    
    db.collection('users').doc(req.query.usrno).delete()

    res.redirect('userList');
});

app.get('/userForm', async function(req,res,next){
    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    let markers = [];
    let languagesdata = {};

    let professions = [];
    let professionsData = {};

    db.collection('languages').get()
    .then(async querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        languagesdata = doc.data();
        languagesdata.langId = doc.id;
        markers = [
            ...markers,
            languagesdata,
        ]
    });


    let activeRef = await db.collection('professions').get();
    for (campaign of activeRef.docs) {
        professionsData = campaign.data();
        professionsData.puid = campaign.id;
        professions = [
            ...professions,
            professionsData,
        ]
    }

    if (!req.query.usrno) {
        res.render('template/userForm', {row: markers, professions: professions});
    console.log(markers);
    }else{
        db.collection('users').doc(req.query.usrno).get()
        .then((doc) => {
            var childData = doc.data();
            res.render('template/userForm', {row: markers, professions: professions,row1: childData});
        })

    }
    
  });
});

exports.app = functions.https.onRequest(app);
