function addfun(test){
	console.log("Test adding: "+ JSON.stringify(test));


	test.att.forEach(function(att) {
		console.log("ll:" +att +" " +test['W_att'][att]);

	});
	spinningBoxFan = test['W_att']['on_off'];
} 
function updatefan(test){
	console.log("Updateing Fan: "+ JSON.stringify(test));
} 

function dropFan (){
	console.log("Droping Fan");
}

listOBJ['fan'] = {};
listOBJ['fan']['add'] = addfun;
listOBJ['fan']['update'] = updatefan;
listOBJ['fan']['drop'] = dropFan;