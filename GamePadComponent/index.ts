import {IInputs, IOutputs} from "./generated/ManifestTypes";

const unique = (value:any, index:number, self:any) => { 
	return self.indexOf(value) === index; 
}

export class GamePadComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	private _container: HTMLDivElement;
	private _context: ComponentFramework.Context<IInputs>;
	private _notifyOutputChanged: () => void;
	private _connected: number[] = [];
	//private _pad1Vibrate: number = 0

	private _pad1_index: number = 0;
	private _pad1: Gamepad;

	private _pad2_index: number = 1;
	private _pad2: Gamepad;
	private _ticks: number = 100;

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		this._container = document.createElement("div");
		// this._container.setAttribute("type", "text");
		this._context = context;
		this._notifyOutputChanged = notifyOutputChanged;
		// this._container.addEventListener('change', this.notify.bind(this));
		// const btn = document.createElement('button');
		// btn.innerText = "button";
		// btn.addEventListener('click', this.notify.bind(this));
		container.appendChild(this._container);
		// container.appendChild(btn);

		// Add control initialization code
		window.addEventListener("gamepadconnected", (event:any) => {
			console.log("A gamepad connected:");
			console.log(event.gamepad);
			this._connected = [...this._connected, event.gamepad.index].filter(unique)
			//this.updateView(context);
		});
		window.addEventListener("gamepaddisconnected", (event:any) => {
			console.log("A gamepad disconnected:");
			console.log(event.gamepad);
			this._connected = this._connected.filter((value)=>value!==event.gamepad.index);
			//this.updateView(context);
		});
		this.tick();
	}

	private pollGamepads() {
		if (navigator.getGamepads) {
		  return navigator.getGamepads();
		} else {
		  return [];
		}
	}

	public notify() {
		this._notifyOutputChanged();
	}

	public tick() {
		// Add code to update control view
		var gamepads = this.pollGamepads();
		if (gamepads && gamepads.length > 0) {
			const pads = Object.keys(gamepads).filter((key:any)=>!!gamepads[key]).map( (key:any)=>{
				const pad = gamepads[key];
				return pad;
			});
			this._container.innerText = pads.map((pad)=>{
				return JSON.stringify({
					axes: pad?.axes,
					buttons: (pad?.buttons || []).map((button)=>{
						return {
							pressed: button.pressed,
							touched: button.touched,
							value: button.value
						}
					}),
					connected: pad?.connected,
					id: pad?.id,
					index: pad?.index
				})
			}).join(';');

			// // Dispatch it.
			// var event = new Event('change');
			// this._container.dispatchEvent(event);

			this._pad1 = gamepads[this._pad1_index] as Gamepad;
			this._pad2 = gamepads[this._pad2_index] as Gamepad;
			this.notify();
			setTimeout(()=>this.tick(), this._ticks);
			//window.requestAnimationFrame(()=>this.tick());
		}
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		this._ticks = context.parameters.timeout.raw ?? 100;

		const vibrate1 = context.parameters.pad1Vibrate.raw;
		const vibrate2 = context.parameters.pad2Vibrate.raw;
		let dirty = false;
		if (vibrate1) {
			// this._pad1Vibrate = vibrate;
			if ('vibrationActuator' in this._pad1) {
				(this._pad1 as any).vibrationActuator.playEffect("dual-rumble", {
					startDelay: 0,
					duration: vibrate1, //this._pad1Vibrate,
					weakMagnitude: 1.0,
					strongMagnitude: 1.0
				});	
			}
			// this._pad1Vibrate = 0;
			dirty = true;
		}
		if (vibrate2) {
			// this._pad1Vibrate = vibrate;
			if ('vibrationActuator' in this._pad2) {
				(this._pad2 as any).vibrationActuator.playEffect("dual-rumble", {
					startDelay: 0,
					duration: vibrate2, //this._pad1Vibrate,
					weakMagnitude: 1.0,
					strongMagnitude: 1.0
				});	
			}
			// this._pad1Vibrate = 0;
			dirty = true;
		}
		const pad1_index = context.parameters.pad1_index.raw;
		const pad2_index = context.parameters.pad2_index.raw;
		if (this._pad1_index != pad1_index) {
			this._pad1_index = pad1_index ?? 0;
			dirty = true;
		}
		if (this._pad2_index != pad2_index) {
			this._pad2_index = pad2_index ?? 1;
			dirty = true;
		}
		if (dirty) {
			this.notify();
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {
			"pad1Vibrate": 0,
			"pad1_index": this._pad1_index,
			"pad1_id": this._pad1?.id ?? '',
			"pad1_connected": this._pad1?.connected ?? false,
			"pad1_0X": this._pad1?.axes[0],
			"pad1_0Y": this._pad1?.axes[1],
			"pad1_1X": this._pad1?.axes[2],
			"pad1_1Y": this._pad1?.axes[3],

			"pad1Button0": this._pad1?.buttons[0].value,
			"pad1Button1": this._pad1?.buttons[1].value,
			"pad1Button2": this._pad1?.buttons[2].value,
			"pad1Button3": this._pad1?.buttons[3].value,
			"pad1Button4": this._pad1?.buttons[4].value,
			"pad1Button5": this._pad1?.buttons[5].value,
			"pad1Button6": this._pad1?.buttons[6].value,
			"pad1Button7": this._pad1?.buttons[7].value,
			"pad1Button8": this._pad1?.buttons[8].value,
			"pad1Button9": this._pad1?.buttons[9].value,
			"pad1Button10": this._pad1?.buttons[10].value,
			"pad1Button11": this._pad1?.buttons[11].value,
			"pad1Button12": this._pad1?.buttons[12].value,
			"pad1Button13": this._pad1?.buttons[13].value,
			"pad1Button14": this._pad1?.buttons[14].value,
			"pad1Button15": this._pad1?.buttons[15].value,

			"pad2Vibrate": 0,
			"pad2_index": this._pad2_index,
			"pad2_id": this._pad2?.id ?? '',
			"pad2_connected": this._pad2?.connected ?? false,
			"pad2_0X": this._pad2?.axes[0],
			"pad2_0Y": this._pad2?.axes[1],
			"pad2_1X": this._pad2?.axes[2],
			"pad2_1Y": this._pad2?.axes[3],

			"pad2Button0": this._pad2?.buttons[0].value,
			"pad2Button1": this._pad2?.buttons[1].value,
			"pad2Button2": this._pad2?.buttons[2].value,
			"pad2Button3": this._pad2?.buttons[3].value,
			"pad2Button4": this._pad2?.buttons[4].value,
			"pad2Button5": this._pad2?.buttons[5].value,
			"pad2Button6": this._pad2?.buttons[6].value,
			"pad2Button7": this._pad2?.buttons[7].value,
			"pad2Button8": this._pad2?.buttons[8].value,
			"pad2Button9": this._pad2?.buttons[9].value,
			"pad2Button10": this._pad2?.buttons[10].value,
			"pad2Button11": this._pad2?.buttons[11].value,
			"pad2Button12": this._pad2?.buttons[12].value,
			"pad2Button13": this._pad2?.buttons[13].value,
			"pad2Button14": this._pad2?.buttons[14].value,
			"pad2Button15": this._pad2?.buttons[15].value,

		};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}
}