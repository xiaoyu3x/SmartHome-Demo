# Smart Home Admin Portal

The admin portal allows Home administrators to point the Cloud to the Gateway Rest Service. The admin portal is listening on 4000 by default and the default credential is admin/admin.    
 
## How to start the admin portal
1. Make sure to run `python <smarthome-web-portal>/initial_db.py` firstly to pre-populate the data and db schema. (***Be sure to install the web portal dependencies and start the MySQL server beforehand.***)      
2. Install all `Python` dependencies (Run the command below)    
    `pip install -r requirements.txt` 
3. Start the server:    
```
    python run.py # Start server on port 4000.
```

## How to set the gateway url
1. Login with admin credential    
2. Click "Gateway" tab on the left hand  
   ![admin portal](../../screenshots/smarthome-adminportal.PNG)
3. Click the "Edit" icon of the gateway "demo"    
4. Update the "Gateway Url" field and save the change     


