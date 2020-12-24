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
	private _pad1?: Gamepad;

	private _pad2_index: number = 1;
	private _pad2?: Gamepad;
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

			if (gamepads.length > this._pad1_index) {
				this._pad1 = gamepads[this._pad1_index] as Gamepad;
			}
			else {
				this._pad1 = undefined;
			}
			if (gamepads.length > this._pad2_index) {
				this._pad2 = gamepads[this._pad2_index] as Gamepad;
			}
			else {
				this._pad1 = undefined;
			}
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
			if (this._pad1 && 'vibrationActuator' in this._pad1) {
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
			if (this._pad2 && 'vibrationActuator' in this._pad2) {
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
			"pad1_0X": this.axesValue(this._pad1, 0),
			"pad1_0Y": this.axesValue(this._pad1, 1),
			"pad1_1X": this.axesValue(this._pad1, 2),
			"pad1_1Y": this.axesValue(this._pad1, 3),

			"pad1Button0": this.buttonValue(this._pad1, 0),
			"pad1Button1": this.buttonValue(this._pad1, 1),
			"pad1Button2": this.buttonValue(this._pad1, 2),
			"pad1Button3": this.buttonValue(this._pad1, 3),
			"pad1Button4": this.buttonValue(this._pad1, 4),
			"pad1Button5": this.buttonValue(this._pad1, 5),
			"pad1Button6": this.buttonValue(this._pad1, 6),
			"pad1Button7": this.buttonValue(this._pad1, 7),
			"pad1Button8": this.buttonValue(this._pad1, 8),
			"pad1Button9": this.buttonValue(this._pad1, 9),
			"pad1Button10": this.buttonValue(this._pad1, 10),
			"pad1Button11": this.buttonValue(this._pad1, 11),
			"pad1Button12": this.buttonValue(this._pad1, 12),
			"pad1Button13": this.buttonValue(this._pad1, 13),
			"pad1Button14": this.buttonValue(this._pad1, 14),
			"pad1Button15": this.buttonValue(this._pad1, 15),

			"pad2Vibrate": 0,
			"pad2_index": this._pad2_index,
			"pad2_id": this._pad2?.id ?? '',
			"pad2_connected": this._pad2?.connected ?? false,
			"pad2_0X": this.axesValue(this._pad2, 0),
			"pad2_0Y": this.axesValue(this._pad2, 1),
			"pad2_1X": this.axesValue(this._pad2, 2),
			"pad2_1Y": this.axesValue(this._pad2, 3),

			"pad2Button0":  this.buttonValue(this._pad2, 0),
			"pad2Button1":  this.buttonValue(this._pad2, 1),
			"pad2Button2":  this.buttonValue(this._pad2, 2),
			"pad2Button3":  this.buttonValue(this._pad2, 3),
			"pad2Button4":  this.buttonValue(this._pad2, 4),
			"pad2Button5":  this.buttonValue(this._pad2, 5),
			"pad2Button6":  this.buttonValue(this._pad2, 6),
			"pad2Button7":  this.buttonValue(this._pad2, 7),
			"pad2Button8":  this.buttonValue(this._pad2, 8),
			"pad2Button9":  this.buttonValue(this._pad2, 9),
			"pad2Button10": this.buttonValue(this._pad2, 10),
			"pad2Button11": this.buttonValue(this._pad2, 11),
			"pad2Button12": this.buttonValue(this._pad2, 12),
			"pad2Button13": this.buttonValue(this._pad2, 13),
			"pad2Button14": this.buttonValue(this._pad2, 14),
			"pad2Button15": this.buttonValue(this._pad2, 15),

		};
	}

	private buttonValue(pad?: Gamepad, buttonIndex?: number): number | undefined {
		if (pad && buttonIndex !== undefined) {
			if (pad?.buttons.length > buttonIndex) {
				return pad?.buttons[buttonIndex].value;
			}			
		}
		return 0;
	}

	private axesValue(pad?: Gamepad, axesIndex?: number): number | undefined {
		if (pad && axesIndex !== undefined) {
			if (pad?.axes.length > axesIndex) {
				return pad?.axes[axesIndex];
			}			
		}
		return 0;
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