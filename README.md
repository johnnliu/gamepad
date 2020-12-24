# gamepad

A Power Apps Component Framework (PCF) component that exports Gamepad API to Power Apps.

* Supports up to 2 gamepad devices
* Two axis sticks
* 16 buttons
* Vibrate/Rumble function
* Refresh at 100ms

# works with

* Edge, Chrome on Windows PC
* Xbox One, Xbox One X, Xbox One Series X
* Andriod Mobile phone browser

# don't know, but should work (because Gamepad API is pretty old and well supported)

* Any Chrome or Edge (both old/new)
* FireFox
* Safari
* iPad, Mac
* Play Station
* Play Station Controllers 

# FAQ

What's timer (default to 100).  The Gamepad API will continuously refresh, but we can only output to Power Apps on a 100ms timer.  If the number is shorter, PCF component update seems to break.

How to use Rumble.  Bind the gamepad component's pad1_vibrate or pad2_vibrate properties to variables.  Set(varVibrate1, 500) for 500ms of rumble.  0 is ignored.

Axis rest position.  The axis rarely reset back to true center of (0, 0).  Usually they are at rest on some variation of (0.04xxx, 0.09yyyy), so the best way to test is to set up a deadzone comparison and ignore using formula If(pad1_0X > 0.1 Or pad1_0Y > 01, ... );

# Upgrading package

1. re-import over the old one, it would ask to Upgrade
2. after solution is imported successfully, go into the solution and click "publish all customizations".
3. close and re-open the Power App studio that's using the PCF, it will ask if you want to update.


